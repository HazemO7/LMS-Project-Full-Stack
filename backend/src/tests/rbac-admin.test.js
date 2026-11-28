process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../app");
const User = require("../models/User");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const PlatformSettings = require("../models/PlatformSettings");
const AuditLog = require("../models/AuditLog");
const GovernanceLock = require("../models/GovernanceLock");
const { createHash } = require("node:crypto");
const { withGovernanceLock, withSuperAdminLock, afterTransactionCommit } = require("../services/governanceLockService");
const { recordAudit } = require("../services/auditService");
const logger = require("../utils/logger");
const seedAdmin = require("../seed/adminSeeder");
const { escapeHtml } = require("../services/emailService");

let mongoServer;

const createAndLoginUser = async ({ name, email, password = "Password123!", role = "student", mustChangePassword = false, isActive = true }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        mustChangePassword,
        isActive,
    });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return { user, token };
};

beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Course.deleteMany({}),
        Module.deleteMany({}),
        Lesson.deleteMany({}),
        Enrollment.deleteMany({}),
        Progress.deleteMany({}),
        PlatformSettings.deleteMany({}),
        AuditLog.deleteMany({}),
        GovernanceLock.deleteMany({}),
    ]);
});

describe("Phase 1: 4-Tier RBAC, Super Admin Governance & Ownership Hardening", () => {
    it("rolls back writes when the lease expires during the callback", async () => {
        const { user } = await createAndLoginUser({ name: "Owner", email: "lease@example.com", role: "super_admin" });
        await expect(withGovernanceLock("expiry-test", async () => {
            await User.updateOne({ _id: user._id }, { $set: { role: "student" } });
            await new Promise((resolve) => setTimeout(resolve, 60));
        }, { leaseMs: 40 })).rejects.toMatchObject({ statusCode: 409 });
        expect((await User.findById(user._id)).role).toBe("super_admin");
    });

    it.each([
        { name: "Course", Parent: Course, Child: Module, route: "courses", list: "modules", backlink: "course" },
        { name: "Module", Parent: Module, Child: Lesson, route: "modules", list: "lesson", backlink: "module" },
    ])("rolls back a failed move between $name documents", async (fixture) => {
        const { Parent, Child, route, list, backlink } = fixture;
        const { token } = await createAndLoginUser({ name: "Admin", email: "move@example.com", role: "admin" });
        const fields = { title: "Fixture", description: "Desc", content: "Text" };
        const destination = await Parent.create(fields);
        const source = await Parent.create(fields);
        const child = await Child.create({ ...fields, [backlink]: source._id });
        await Parent.updateOne({ _id: source._id }, { $push: { [list]: child._id } });

        const failure = jest.spyOn(Parent, "updateMany").mockRejectedValueOnce(new Error("source pull failed"));
        try {
            const response = await request(app).put(`/api/${route}/${destination._id}`)
                .set("Authorization", `Bearer ${token}`).send({ [list]: [child._id] });
            expect(response.statusCode).toBe(500);
            expect(failure).toHaveBeenCalled();
        } finally {
            failure.mockRestore();
        }
        expect((await Parent.findById(destination._id))[list]).toHaveLength(0);
        expect((await Parent.findById(source._id))[list].map(String)).toEqual([String(child._id)]);
        expect(String((await Child.findById(child._id))[backlink])).toBe(String(source._id));
    });

    it.each(["put", "delete"])("denies module %s when a transfer wins the lock after route authorization", async (method) => {
        const { token: adminToken } = await createAndLoginUser({ name: "Owner", email: "owner@example.com", role: "super_admin" });
        const { user: oldOwner, token } = await createAndLoginUser({ name: "Old", email: "old@example.com", role: "instructor" });
        const { user: newOwner } = await createAndLoginUser({ name: "New", email: "new@example.com", role: "instructor" });
        const fields = { title: "Original", description: "Desc", content: "Text" };
        const course = await Course.create({ ...fields, instructor: oldOwner._id });
        const mod = await Module.create({ ...fields, course: course._id });
        const originalAcquire = GovernanceLock.findOneAndUpdate;
        const acquire = jest.spyOn(GovernanceLock, "findOneAndUpdate").mockImplementationOnce(async function (filter, ...args) {
            const transfer = await request(app).patch(`/api/admin/courses/${course._id}/transfer`)
                .set("Authorization", `Bearer ${adminToken}`).send({ newInstructorId: newOwner._id.toString() });
            expect(transfer.statusCode).toBe(200);
            expect(filter._id).toBe(acquire.mock.calls[1][0]._id);
            return originalAcquire.call(this, filter, ...args);
        });

        try {
            const mutation = request(app)[method](`/api/modules/${mod._id}`).set("Authorization", `Bearer ${token}`);
            if (method === "put") mutation.send({ title: "Changed" });
            expect((await mutation).statusCode).toBe(403);
            expect((await Module.findById(mod._id)).title).toBe("Original");
        } finally {
            acquire.mockRestore();
        }
    });

    it("rejects course and module cascades before deleting shared curriculum or progress", async () => {
        const { user, token } = await createAndLoginUser({ name: "Admin", email: "cascade@example.com", role: "admin" });
        const fields = { title: "Curriculum", description: "Desc", content: "Text" };
        const course = await Course.create(fields);
        const otherCourse = await Course.create(fields);
        const mod = await Module.create({ ...fields, course: course._id });
        const lesson = await Lesson.create({ ...fields, module: mod._id });
        const otherModule = await Module.create({ ...fields, course: otherCourse._id, lesson: [lesson._id] });
        const progress = await Progress.create({ user: user._id, course: course._id, lesson: lesson._id });

        const remove = (resource, id) => request(app).delete(`/api/${resource}/${id}`)
            .set("Authorization", `Bearer ${token}`);

        // A separate module holds the lesson even though its backlink points into the cascade.
        expect((await remove("courses", course._id)).statusCode).toBe(409);
        expect((await remove("modules", mod._id)).statusCode).toBe(409);
        expect(await Progress.exists({ _id: progress._id })).toBeTruthy();
        expect(await Lesson.exists({ _id: lesson._id })).toBeTruthy();

        await Module.updateOne({ _id: otherModule._id }, { $pull: { lesson: lesson._id } });
        await Course.updateOne({ _id: otherCourse._id }, { $push: { modules: mod._id } });
        expect((await remove("courses", course._id)).statusCode).toBe(409);
        expect((await remove("modules", mod._id)).statusCode).toBe(409);
        expect(await Module.exists({ _id: mod._id })).toBeTruthy();
        expect(await Progress.exists({ _id: progress._id })).toBeTruthy();

        await Course.updateOne({ _id: otherCourse._id }, { $pull: { modules: mod._id } });
        expect((await remove("modules", mod._id)).statusCode).toBe(200);
        expect(await Lesson.exists({ _id: lesson._id })).toBeNull();
        expect(await Progress.exists({ _id: progress._id })).toBeNull();
    });

    it("seeds super_admin and idempotently promotes legacy owner admin", async () => {
        process.env.ADMIN_NAME = "Owner";
        process.env.ADMIN_EMAIL = "owner@example.com";
        process.env.ADMIN_PASSWORD = "OwnerPassword123!";

        const legacyHash = await bcrypt.hash("OwnerPassword123!", 10);
        await User.create({
            name: "Owner",
            email: "owner@example.com",
            password: legacyHash,
            role: "admin",
        });

        await seedAdmin();
        const promoted = await User.findOne({ email: "owner@example.com" });
        expect(promoted.role).toBe("super_admin");
    });

    it("enforces super_admin vs admin hierarchy when creating staff and updating roles", async () => {
        const { token: superToken } = await createAndLoginUser({
            name: "Super",
            email: "super@example.com",
            role: "super_admin",
        });

        // Super admin can create an admin
        const createAdminRes = await request(app)
            .post("/api/admin/users")
            .set("Authorization", `Bearer ${superToken}`)
            .send({
                name: "Platform Admin",
                email: "admin@example.com",
                role: "admin",
                temporaryPassword: "AdminTemp123!",
                sendEmail: false,
            });
        expect(createAdminRes.statusCode).toBe(201);
        expect(createAdminRes.body.data.role).toBe("admin");
        expect(createAdminRes.body.data.mustChangePassword).toBe(true);

        // Rotate admin password so admin can call protected APIs
        const adminLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@example.com", password: "AdminTemp123!" });
        expect(adminLogin.body.mustChangePassword).toBe(true);

        await request(app)
            .put("/api/auth/change-password")
            .set("Authorization", `Bearer ${adminLogin.body.token}`)
            .send({ currentPassword: "AdminTemp123!", newPassword: "AdminNewPass123!" });

        const adminLogin2 = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@example.com", password: "AdminNewPass123!" });
        const adminToken = adminLogin2.body.token;

        // Admin CAN create an instructor with auto-generated temp password
        const createInstRes = await request(app)
            .post("/api/admin/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "Dr. Sara",
                email: "sara@example.com",
                role: "instructor",
                specialty: "Distributed Systems",
                sendEmail: false,
            });
        expect(createInstRes.statusCode).toBe(201);
        expect(createInstRes.body.data.role).toBe("instructor");
        expect(createInstRes.body.temporaryPassword).toBeTruthy();

        // Admin CANNOT create another admin or super_admin
        const forbiddenAdminRes = await request(app)
            .post("/api/admin/users")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "Rogue Admin",
                email: "rogue@example.com",
                role: "admin",
                sendEmail: false,
            });
        expect(forbiddenAdminRes.statusCode).toBe(403);

        // Admin CANNOT promote instructor to admin
        const promoteRes = await request(app)
            .patch(`/api/admin/users/${createInstRes.body.data._id}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "admin" });
        expect(promoteRes.statusCode).toBe(403);
    });

    it("locks API access until temporary password is rotated on first login", async () => {
        const { token: superToken } = await createAndLoginUser({
            name: "Super",
            email: "super2@example.com",
            role: "super_admin",
        });

        const createRes = await request(app)
            .post("/api/admin/users")
            .set("Authorization", `Bearer ${superToken}`)
            .send({
                name: "New Instructor",
                email: "inst@example.com",
                role: "instructor",
                temporaryPassword: " Aa1!abc ",
                sendEmail: false,
            });
        const tempPassword = createRes.body.temporaryPassword;
        expect(tempPassword).toBe(" Aa1!abc ");

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "inst@example.com", password: tempPassword });
        expect(loginRes.statusCode).toBe(200);
        expect(loginRes.body.mustChangePassword).toBe(true);
        const tempToken = loginRes.body.token;

        // Blocked from creating course until password rotated
        const blockedRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${tempToken}`)
            .send({ title: "Blocked Course", description: "Should fail" });
        expect(blockedRes.statusCode).toBe(403);
        expect(blockedRes.body.code).toBe("PASSWORD_CHANGE_REQUIRED");

        // /api/users/me IS allowed
        const meRes = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${tempToken}`);
        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.data.mustChangePassword).toBe(true);

        // Change password
        const changeRes = await request(app)
            .put("/api/auth/change-password")
            .set("Authorization", `Bearer ${tempToken}`)
            .send({ currentPassword: tempPassword, newPassword: "InstructorStrong123!" });
        expect(changeRes.statusCode).toBe(200);

        const freshLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: "inst@example.com", password: "InstructorStrong123!" });
        expect(freshLogin.body.mustChangePassword).toBe(false);

        const allowedRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${freshLogin.body.token}`)
            .send({ title: "Unlocked Course", description: "Works now" });
        expect(allowedRes.statusCode).toBe(201);
    });

    it("prevents cross-instructor curriculum edits via courseOwnershipGuard", async () => {
        const { token: instAToken } = await createAndLoginUser({
            name: "Instructor A",
            email: "insta@example.com",
            role: "instructor",
        });
        const { token: instBToken } = await createAndLoginUser({
            name: "Instructor B",
            email: "instb@example.com",
            role: "instructor",
        });

        const courseRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${instAToken}`)
            .send({ title: "Course A", description: "Owned by A" });
        const courseId = courseRes.body.data._id;

        const modRes = await request(app)
            .post("/api/modules")
            .set("Authorization", `Bearer ${instAToken}`)
            .send({ title: "Mod 1", description: "Desc", content: "Content", course: courseId });
        const moduleId = modRes.body._id;

        await request(app)
            .put(`/api/courses/${courseId}`)
            .set("Authorization", `Bearer ${instAToken}`)
            .send({ modules: [moduleId] });

        const lessonRes = await request(app)
            .post("/api/lessons")
            .set("Authorization", `Bearer ${instAToken}`)
            .send({
                module: moduleId,
                title: "Lesson 1",
                description: "Desc",
                content: "Notes",
            });
        const lessonId = lessonRes.body._id;

        // Instructor B cannot edit course, module, or lesson
        const editCourseB = await request(app)
            .put(`/api/courses/${courseId}`)
            .set("Authorization", `Bearer ${instBToken}`)
            .send({ title: "Hijacked" });
        expect(editCourseB.statusCode).toBe(403);

        const editModuleB = await request(app)
            .put(`/api/modules/${moduleId}`)
            .set("Authorization", `Bearer ${instBToken}`)
            .send({ title: "Hijacked Mod" });
        expect(editModuleB.statusCode).toBe(403);

        const deleteLessonB = await request(app)
            .delete(`/api/lessons/${lessonId}`)
            .set("Authorization", `Bearer ${instBToken}`);
        expect(deleteLessonB.statusCode).toBe(403);
    });

    it("supports account suspension, course ownership transfer, audit logs, and platform settings", async () => {
        const { user: superUser, token: superToken } = await createAndLoginUser({
            name: "Super",
            email: "super3@example.com",
            role: "super_admin",
        });
        const { user: instA, token: instAToken } = await createAndLoginUser({
            name: "Inst A",
            email: "a3@example.com",
            role: "instructor",
        });
        const { user: instB } = await createAndLoginUser({
            name: "Inst B",
            email: "b3@example.com",
            role: "instructor",
        });

        const courseRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${instAToken}`)
            .send({ title: "Transferable Course", description: "Testing transfer" });
        const courseId = courseRes.body.data._id;

        // Transfer ownership to instB
        const transferRes = await request(app)
            .patch(`/api/admin/courses/${courseId}/transfer`)
            .set("Authorization", `Bearer ${superToken}`)
            .send({ newInstructorId: instB._id.toString() });
        expect(transferRes.statusCode).toBe(200);
        expect(transferRes.body.data.instructor._id).toBe(instB._id.toString());

        // Self-deletion is rejected with its explicit guard message
        const delSuperRes = await request(app)
            .delete(`/api/admin/users/${superUser._id}`)
            .set("Authorization", `Bearer ${superToken}`);
        expect(delSuperRes.statusCode).toBe(400);
        expect(delSuperRes.body.message).toBe("You cannot delete your own account.");

        // Suspend instA -> rejects existing JWT and login
        const suspendRes = await request(app)
            .patch(`/api/admin/users/${instA._id}/status`)
            .set("Authorization", `Bearer ${superToken}`)
            .send({ isActive: false });
        expect(suspendRes.statusCode).toBe(200);

        const suspendedApiCall = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${instAToken}`);
        expect(suspendedApiCall.statusCode).toBe(403);

        // Disable public registration
        const settingsRes = await request(app)
            .put("/api/admin/settings")
            .set("Authorization", `Bearer ${superToken}`)
            .send({
                allowPublicRegistration: false,
                maxVideoSizeMB: 300,
                maxDocumentSizeMB: 25,
                maxImageSizeMB: 10,
            });
        expect(settingsRes.statusCode).toBe(200);

        const closedRegRes = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Blocked Student",
                email: "blocked@example.com",
                password: "Password123!",
            });
        expect(closedRegRes.statusCode).toBe(403);

        // Audit logs recorded
        const auditRes = await request(app)
            .get("/api/admin/audit-logs")
            .set("Authorization", `Bearer ${superToken}`);
        expect(auditRes.statusCode).toBe(200);
        expect(auditRes.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it("blocks cross-instructor module/lesson hijacking, lesson reparenting, and detached mutations", async () => {
        const { user: instA, token: tokenA } = await createAndLoginUser({
            name: "Instructor A",
            email: "hijack-a@example.com",
            role: "instructor",
        });
        const { token: tokenB } = await createAndLoginUser({
            name: "Instructor B",
            email: "hijack-b@example.com",
            role: "instructor",
        });

        const courseA = await Course.create({ title: "Course A", description: "A", instructor: instA._id });
        const modA1 = await Module.create({ title: "Mod A1", description: "d", content: "c", course: courseA._id });
        const modA2 = await Module.create({ title: "Mod A2", description: "d", content: "c", course: courseA._id });
        courseA.modules = [modA1._id, modA2._id];
        await courseA.save();
        const lessonA = await Lesson.create({ title: "Lesson A", description: "d", content: "c", module: modA1._id });
        modA1.lesson = [lessonA._id];
        await modA1.save();

        const courseBRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Course B", description: "B" });
        const courseBId = courseBRes.body.data._id;

        const modBRes = await request(app)
            .post("/api/modules")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Mod B", description: "d", content: "c", course: courseBId });
        const modBId = modBRes.body._id;

        // Attacker B cannot attach A's module via PUT /api/courses/:ownId
        const hijackCourseRes = await request(app)
            .put(`/api/courses/${courseBId}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ modules: [modA1._id.toString()] });
        expect(hijackCourseRes.statusCode).toBe(403);
        const modA1After = await Module.findById(modA1._id);
        expect(modA1After.course.toString()).toBe(courseA._id.toString());

        // Attacker B cannot attach A's lesson via PUT /api/modules/:ownModId
        const hijackModRes = await request(app)
            .put(`/api/modules/${modBId}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ lesson: [lessonA._id.toString()] });
        expect(hijackModRes.statusCode).toBe(403);
        const lessonAAfter = await Lesson.findById(lessonA._id);
        expect(lessonAAfter.module.toString()).toBe(modA1._id.toString());

        // Disallow reparenting lesson via PUT /api/lessons/:id
        const reparentRes = await request(app)
            .put(`/api/lessons/${lessonA._id}`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ module: modA2._id.toString(), title: "Should Not Move" });
        expect(reparentRes.statusCode).toBe(400);
        const lessonAfterReparent = await Lesson.findById(lessonA._id);
        expect(lessonAfterReparent.module.toString()).toBe(modA1._id.toString());

        // Ownership guard fails closed for detached/orphan modules & creating detached modules by instructor
        const orphanCreateRes = await request(app)
            .post("/api/modules")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Orphan", description: "d", content: "c" });
        expect(orphanCreateRes.statusCode).toBe(403);

        const orphanMod = await Module.create({ title: "Detached", description: "d", content: "c" });
        const orphanEditRes = await request(app)
            .put(`/api/modules/${orphanMod._id}`)
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Tampered" });
        expect(orphanEditRes.statusCode).toBe(403);

        // Deleting course cascades modules and lessons
        const delCourseARes = await request(app)
            .delete(`/api/courses/${courseA._id}`)
            .set("Authorization", `Bearer ${tokenA}`);
        expect(delCourseARes.statusCode).toBe(200);
        expect(await Module.findById(modA1._id)).toBeNull();
        expect(await Lesson.findById(lessonA._id)).toBeNull();
    });

    it("redacts instructor email/role on public GET /api/courses and delays suspended status until password matches", async () => {
        const { user: superUser } = await createAndLoginUser({
            name: "Owner",
            email: "owner-public@example.com",
            role: "super_admin",
        });
        await Course.create({ title: "Public Course", description: "Desc", instructor: superUser._id });

        const coursesRes = await request(app).get("/api/courses");
        expect(coursesRes.statusCode).toBe(200);
        expect(coursesRes.body.data[0].instructor.name).toBe("Owner");
        expect(coursesRes.body.data[0].instructor.email).toBeUndefined();
        expect(coursesRes.body.data[0].instructor.role).toBeUndefined();

        await createAndLoginUser({
            name: "Suspended Student",
            email: "suspended@example.com",
            role: "student",
            isActive: false,
        });

        const wrongPwRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "suspended@example.com", password: "WrongPassword123!" });
        expect(wrongPwRes.statusCode).toBe(401);
        expect(wrongPwRes.body.code).toBeUndefined();

        const rightPwRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "suspended@example.com", password: "Password123!" });
        expect(rightPwRes.statusCode).toBe(403);
        expect(rightPwRes.body.code).toBe("ACCOUNT_SUSPENDED");
    });

    it("serializes concurrent last-super-admin demotions/suspensions and routes legacy /api/users/:id/role cleanly", async () => {
        const { user: super1, token: token1 } = await createAndLoginUser({
            name: "Super 1",
            email: "s1@example.com",
            role: "super_admin",
        });
        const { user: super2, token: token2 } = await createAndLoginUser({
            name: "Super 2",
            email: "s2@example.com",
            role: "super_admin",
        });

        // Concurrent demotion + suspension of the only 2 active super_admins must leave >= 1 active super_admin
        const [res1, res2] = await Promise.all([
            request(app)
                .patch(`/api/admin/users/${super2._id}/role`)
                .set("Authorization", `Bearer ${token1}`)
                .send({ role: "admin" }),
            request(app)
                .patch(`/api/admin/users/${super1._id}/status`)
                .set("Authorization", `Bearer ${token2}`)
                .send({ isActive: false }),
        ]);

        const statuses = [res1.statusCode, res2.statusCode].sort();
        expect(statuses[0]).toBe(200);
        expect([400, 403]).toContain(statuses[1]);

        const remainingActiveSuperAdmins = await User.countDocuments({
            role: "super_admin",
            isActive: { $ne: false },
        });
        expect(remainingActiveSuperAdmins).toBe(1);

        // Legacy /api/users/:id/role enforces Joi validation and admin hierarchy
        const { token: adminToken } = await createAndLoginUser({
            name: "Admin",
            email: "admin-legacy@example.com",
            role: "admin",
        });
        const { user: studentUser } = await createAndLoginUser({
            name: "Student",
            email: "stu-legacy@example.com",
            role: "student",
        });

        const invalidRoleRes = await request(app)
            .patch(`/api/users/${studentUser._id}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "invalid_role" });
        expect(invalidRoleRes.statusCode).toBe(400);

        const promoteToAdminByAdmin = await request(app)
            .patch(`/api/users/${studentUser._id}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "admin" });
        expect(promoteToAdminByAdmin.statusCode).toBe(403);

        const promoteToInstructor = await request(app)
            .patch(`/api/users/${studentUser._id}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "instructor" });
        expect(promoteToInstructor.statusCode).toBe(200);
        expect(promoteToInstructor.body.data.role).toBe("instructor");
    });

    it("handles mocked onboarding email, HTML escaping, and seeder rotation preservation", async () => {
        const { token: superToken } = await createAndLoginUser({
            name: "Super Gov",
            email: "supergov@example.com",
            role: "super_admin",
        });

        // Mocked SMTP reports emailSent: false while preserving temporaryPassword
        const oldHost = process.env.SMTP_HOST;
        delete process.env.SMTP_HOST;
        const onboardRes = await request(app)
            .post("/api/admin/users")
            .set("Authorization", `Bearer ${superToken}`)
            .send({
                name: "Mocked Staff",
                email: "mocked@example.com",
                role: "instructor",
                sendEmail: true,
            });
        if (oldHost !== undefined) process.env.SMTP_HOST = oldHost;
        expect(onboardRes.statusCode).toBe(201);
        expect(onboardRes.body.emailSent).toBe(false);
        expect(onboardRes.body.temporaryPassword).toBeTruthy();

        // HTML escaping preserves semicolon-less entities and markup characters
        expect(escapeHtml("a&gtb&amp<script>'\"")).toBe("a&amp;gtb&amp;amp&lt;script&gt;&#39;&quot;");

        // seedAdmin preserves mustChangePassword: true when promoting legacy admin
        await User.deleteMany({ role: "super_admin" });
        process.env.ADMIN_NAME = "Temp Admin";
        process.env.ADMIN_EMAIL = "temp-owner@example.com";
        process.env.ADMIN_PASSWORD = "TempOwnerPass123!";
        await User.create({
            name: "Temp Admin",
            email: "temp-owner@example.com",
            password: await bcrypt.hash("TempOwnerPass123!", 10),
            role: "admin",
            mustChangePassword: true,
        });
        await seedAdmin();
        const promotedAdmin = await User.findOne({ email: "temp-owner@example.com" });
        expect(promotedAdmin.role).toBe("super_admin");
        expect(promotedAdmin.mustChangePassword).toBe(true);
    });

    it("rejects same-owner transfer, handles retryable unenroll, and clears progress on lesson deletion", async () => {
        const { token: superToken } = await createAndLoginUser({
            name: "Super Gov",
            email: "supergov2@example.com",
            role: "super_admin",
        });
        const { user: inst } = await createAndLoginUser({
            name: "Inst",
            email: "instgov@example.com",
            role: "instructor",
        });
        const { user: student } = await createAndLoginUser({
            name: "Student",
            email: "stugov@example.com",
            role: "student",
        });

        // Same-owner transfer is rejected with 400 and writes no COURSE_TRANSFERRED audit entry
        const course = await Course.create({ title: "Owned Course", description: "d", instructor: inst._id });
        const sameOwnerRes = await request(app)
            .patch(`/api/admin/courses/${course._id}/transfer`)
            .set("Authorization", `Bearer ${superToken}`)
            .send({ newInstructorId: inst._id.toString() });
        expect(sameOwnerRes.statusCode).toBe(400);
        expect(await AuditLog.countDocuments({ action: "COURSE_TRANSFERRED" })).toBe(0);

        // Retryable unenrollment cleans orphaned Progress when Enrollment is absent
        const lesson = await Lesson.create({ title: "L1", description: "d", content: "c" });
        await Progress.create({ user: student._id, course: course._id, lesson: lesson._id, completed: true });
        const retryUnenrollRes = await request(app)
            .delete(`/api/admin/courses/${course._id}/enrollments/${student._id}`)
            .set("Authorization", `Bearer ${superToken}`);
        expect(retryUnenrollRes.statusCode).toBe(200);
        expect(await Progress.countDocuments({ user: student._id, course: course._id })).toBe(0);

        const missingUnenrollRes = await request(app)
            .delete(`/api/admin/courses/${course._id}/enrollments/${student._id}`)
            .set("Authorization", `Bearer ${superToken}`);
        expect(missingUnenrollRes.statusCode).toBe(404);

        // Deleting a lesson clears its Progress records
        const mod = await Module.create({ title: "UM", description: "d", content: "c", course: course._id });
        const lesson2 = await Lesson.create({ title: "UL", description: "d", content: "c", module: mod._id });
        mod.lesson = [lesson2._id];
        await mod.save();
        const uppercaseUpdateRes = await request(app)
            .put(`/api/lessons/${lesson2._id}`)
            .set("Authorization", `Bearer ${superToken}`)
            .send({ module: mod._id.toString().toUpperCase(), title: "UL Updated" });
        expect(uppercaseUpdateRes.statusCode).toBe(200);

        await Progress.create({ user: student._id, course: course._id, lesson: lesson2._id, completed: true });
        const delLessonRes = await request(app)
            .delete(`/api/lessons/${lesson2._id}`)
            .set("Authorization", `Bearer ${superToken}`);
        expect(delLessonRes.statusCode).toBe(200);
        expect(await Progress.countDocuments({ lesson: lesson2._id })).toBe(0);
    });

    it("validates ObjectIds, demotes suspended super_admin, and updates partial settings", async () => {
        const { token: superToken } = await createAndLoginUser({
            name: "Super Gov",
            email: "supergov3@example.com",
            role: "super_admin",
        });

        const badIdRes = await request(app)
            .patch("/api/admin/users/not-an-object-id/role")
            .set("Authorization", `Bearer ${superToken}`)
            .send({ role: "instructor" });
        expect(badIdRes.statusCode).toBe(400);

        const nonStringCourseRes = await request(app)
            .post("/api/modules")
            .set("Authorization", `Bearer ${superToken}`)
            .send({ title: "Bad", description: "d", content: "c", course: { id: "64b000000000000000000001" } });
        expect(nonStringCourseRes.statusCode).toBe(400);

        const { user: suspendedSuper } = await createAndLoginUser({
            name: "Suspended Super",
            email: "suspended-super@example.com",
            role: "super_admin",
            isActive: false,
        });
        const demoteSuspendedRes = await request(app)
            .patch(`/api/admin/users/${suspendedSuper._id}/role`)
            .set("Authorization", `Bearer ${superToken}`)
            .send({ role: "admin" });
        expect(demoteSuspendedRes.statusCode).toBe(200);

        await request(app)
            .put("/api/admin/settings")
            .set("Authorization", `Bearer ${superToken}`)
            .send({ allowPublicRegistration: false });
        const partialSettingsRes = await request(app)
            .put("/api/admin/settings")
            .set("Authorization", `Bearer ${superToken}`)
            .send({ maxImageSizeMB: 12 });
        expect(partialSettingsRes.statusCode).toBe(200);
        expect(partialSettingsRes.body.data.allowPublicRegistration).toBe(false);
        expect(partialSettingsRes.body.data.maxImageSizeMB).toBe(12);
    });

    it("blocks direct instructor-field spoofing, foreign curriculum creation, and unauthorized read bypasses", async () => {
        const { user: instA, token: tokenA } = await createAndLoginUser({
            name: "Owner Inst",
            email: "bypass-a@example.com",
            role: "instructor",
        });
        const { user: instB, token: tokenB } = await createAndLoginUser({
            name: "Attacker Inst",
            email: "bypass-b@example.com",
            role: "instructor",
        });
        const { user: student, token: studentToken } = await createAndLoginUser({
            name: "Unenrolled Student",
            email: "bypass-stu@example.com",
            role: "student",
        });

        // Instructor B cannot forge a course under Instructor A's ID
        const forgedCourseRes = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Spoofed", description: "d", instructor: instA._id.toString() });
        expect(forgedCourseRes.statusCode).toBe(201);
        expect(forgedCourseRes.body.data.instructor._id).toBe(instB._id.toString());

        const courseA = await Course.create({ title: "Owned A", description: "d", instructor: instA._id });
        const modA = await Module.create({ title: "Mod A", description: "d", content: "c", course: courseA._id });
        courseA.modules = [modA._id];
        await courseA.save();
        const lessonA = await Lesson.create({ title: "Lesson A", description: "d", content: "c", module: modA._id });
        modA.lesson = [lessonA._id];
        await modA.save();

        // Owner cannot reassign instructor via PUT /api/courses/:id (whitelist strips instructor)
        const selfTransferAttempt = await request(app)
            .put(`/api/courses/${courseA._id}`)
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ title: "Owned A Updated", instructor: instB._id.toString() });
        expect(selfTransferAttempt.statusCode).toBe(200);
        expect((await Course.findById(courseA._id)).instructor.toString()).toBe(instA._id.toString());

        // Attacker B cannot create module/lesson inside A's course or create detached lesson
        expect((await request(app).post("/api/modules").set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "X", description: "d", content: "c", course: courseA._id.toString() })).statusCode).toBe(403);
        expect((await request(app).post("/api/lessons").set("Authorization", `Bearer ${tokenB}`)
            .send({ module: modA._id.toString(), title: "X", description: "d", content: "c" })).statusCode).toBe(403);
        expect((await request(app).post("/api/lessons").set("Authorization", `Bearer ${tokenB}`)
            .send({ title: "Detached", description: "d", content: "c" })).statusCode).toBe(403);

        // Standalone module/lesson list & read guards block unenrolled students and non-owning instructors
        expect((await request(app).get("/api/modules").set("Authorization", `Bearer ${studentToken}`)).statusCode).toBe(403);
        expect((await request(app).get("/api/lessons").set("Authorization", `Bearer ${tokenB}`)).statusCode).toBe(403);
        expect((await request(app).get(`/api/modules/${modA._id}`).set("Authorization", `Bearer ${studentToken}`)).statusCode).toBe(403);
        expect((await request(app).get(`/api/lessons/${lessonA._id}`).set("Authorization", `Bearer ${tokenB}`)).statusCode).toBe(403);

        // Enrolling student grants read access to module and lesson
        await Enrollment.create({ user: student._id, course: courseA._id });
        expect((await request(app).get(`/api/modules/${modA._id}`).set("Authorization", `Bearer ${studentToken}`)).statusCode).toBe(200);
        expect((await request(app).get(`/api/lessons/${lessonA._id}`).set("Authorization", `Bearer ${studentToken}`)).statusCode).toBe(200);
    });

    it("requires currentPassword on PATCH /api/users/me password change and redacts sensitive fields", async () => {
        const regRes = await request(app).post("/api/auth/register").send({
            name: "Reg Student",
            email: "reg-redact@example.com",
            password: "Password123!",
        });
        expect(regRes.statusCode).toBe(201);
        expect(regRes.body.data.password).toBeUndefined();
        expect(regRes.body.data.resetPasswordToken).toBeUndefined();

        const { user, token } = await createAndLoginUser({
            name: "Self User",
            email: "self-me@example.com",
            password: "OldPassword123!",
            role: "student",
        });
        await User.updateOne(
            { _id: user._id },
            { $set: { resetPasswordToken: "secret-hash", resetPasswordExpire: new Date(Date.now() + 60000), resetPasswordTokenCreatedAt: new Date() } }
        );

        const meRes = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.data.resetPasswordToken).toBeUndefined();
        expect(meRes.body.data.resetPasswordExpire).toBeUndefined();
        expect(meRes.body.data.resetPasswordTokenCreatedAt).toBeUndefined();

        const nameUpdateRes = await request(app).patch("/api/users/me").set("Authorization", `Bearer ${token}`).send({ name: "Renamed" });
        expect(nameUpdateRes.statusCode).toBe(200);
        expect(nameUpdateRes.body.data.resetPasswordToken).toBeUndefined();

        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${token}`).send({ password: "NewPassword123!" })).statusCode).toBe(400);
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${token}`).send({ currentPassword: "WrongPassword123!", password: "NewPassword123!" })).statusCode).toBe(401);
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${token}`).send({ currentPassword: "OldPassword123!", password: "OldPassword123!" })).statusCode).toBe(400);

        const okPwRes = await request(app).patch("/api/users/me").set("Authorization", `Bearer ${token}`)
            .send({ currentPassword: "OldPassword123!", password: "NewPassword123!" });
        expect(okPwRes.statusCode).toBe(200);
        expect(okPwRes.body.data.password).toBeUndefined();
        expect(okPwRes.body.data.resetPasswordToken).toBeUndefined();
    });

    it("rejects invalid course IDs in enrollmentGuard and denies lesson edit after lock-competing transfer", async () => {
        const { token: superToken } = await createAndLoginUser({ name: "Super", email: "super-guard@example.com", role: "super_admin" });
        const { user: oldOwner, token: oldToken } = await createAndLoginUser({ name: "Old", email: "old-les@example.com", role: "instructor" });
        const { user: newOwner } = await createAndLoginUser({ name: "New", email: "new-les@example.com", role: "instructor" });

        const badIdRes = await request(app).get("/api/courses/invalid-id/full").set("Authorization", `Bearer ${oldToken}`);
        expect(badIdRes.statusCode).toBe(400);
        expect(badIdRes.body.error).toBeUndefined();

        const course = await Course.create({ title: "Lesson Lock", description: "d", instructor: oldOwner._id });
        const mod = await Module.create({ title: "M1", description: "d", content: "c", course: course._id });
        const lesson = await Lesson.create({ title: "Original Lesson", description: "d", content: "c", module: mod._id });

        const originalAcquire = GovernanceLock.findOneAndUpdate;
        const acquire = jest.spyOn(GovernanceLock, "findOneAndUpdate").mockImplementationOnce(async function (filter, ...args) {
            const transfer = await request(app).patch(`/api/admin/courses/${course._id}/transfer`)
                .set("Authorization", `Bearer ${superToken}`).send({ newInstructorId: newOwner._id.toString() });
            expect(transfer.statusCode).toBe(200);
            expect(filter._id).toBe(acquire.mock.calls[1][0]._id);
            return originalAcquire.call(this, filter, ...args);
        });

        try {
            const updateRes = await request(app).put(`/api/lessons/${lesson._id}`)
                .set("Authorization", `Bearer ${oldToken}`).send({ title: "Hijacked Lesson" });
            expect(updateRes.statusCode).toBe(403);
            expect((await Lesson.findById(lesson._id)).title).toBe("Original Lesson");
        } finally {
            acquire.mockRestore();
        }
    });

    it("revokes same-second pre-rotation tokens across password replacement paths", async () => {
        const resetPlain = "b".repeat(64);
        const resetHash = createHash("sha256").update(resetPlain).digest("hex");
        await createAndLoginUser({ name: "Rotate User", email: "rot-ver@example.com", password: "Password123!", role: "student" });
        const loginA = await request(app).post("/api/auth/login").send({ email: "rot-ver@example.com", password: "Password123!" });

        await request(app).put("/api/auth/change-password").set("Authorization", `Bearer ${loginA.body.token}`)
            .send({ currentPassword: "Password123!", newPassword: "Password456!" });
        expect((await request(app).get("/api/users/me").set("Authorization", `Bearer ${loginA.body.token}`)).statusCode).toBe(401);

        const loginB = await request(app).post("/api/auth/login").send({ email: "rot-ver@example.com", password: "Password456!" });
        await request(app).patch("/api/users/me").set("Authorization", `Bearer ${loginB.body.token}`)
            .send({ currentPassword: "Password456!", password: "Password789!" });
        expect((await request(app).get("/api/users/me").set("Authorization", `Bearer ${loginB.body.token}`)).statusCode).toBe(401);

        const loginC = await request(app).post("/api/auth/login").send({ email: "rot-ver@example.com", password: "Password789!" });
        await User.updateOne({ email: "rot-ver@example.com" }, { $set: { resetPasswordToken: resetHash, resetPasswordExpire: new Date(Date.now() + 60000) } });
        await request(app).put(`/api/auth/reset-password/${resetPlain}`).send({ password: "Password999!" });
        expect((await request(app).get("/api/users/me").set("Authorization", `Bearer ${loginC.body.token}`)).statusCode).toBe(401);

        const loginD = await request(app).post("/api/auth/login").send({ email: "rot-ver@example.com", password: "Password999!" });
        const meRes = await request(app).get("/api/users/me").set("Authorization", `Bearer ${loginD.body.token}`);
        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.data.tokenVersion).toBeUndefined();
    });

    it("blocks sole active super_admin self-demotion, shared-lesson edits, and email/bcrypt abuse", async () => {
        const { user: soleSuper, token: superToken } = await createAndLoginUser({ name: "Super", email: "super-inv@example.com", role: "super_admin" });
        const selfDemoteRes = await request(app).patch(`/api/admin/users/${soleSuper._id}/role`)
            .set("Authorization", `Bearer ${superToken}`).send({ role: "admin" });
        expect(selfDemoteRes.statusCode).toBe(400);
        expect(selfDemoteRes.body.message).toBe("Cannot demote the last active Super Admin.");

        const { user: instA, token: tokenA } = await createAndLoginUser({ name: "Inst A", email: "insta-inv@example.com", role: "instructor" });
        const { user: instB } = await createAndLoginUser({ name: "Inst B", email: "instb-inv@example.com", role: "instructor" });
        const courseA = await Course.create({ title: "Course A", description: "d", instructor: instA._id });
        const courseB = await Course.create({ title: "Course B", description: "d", instructor: instB._id });
        const modA = await Module.create({ title: "MA", description: "d", content: "c", course: courseA._id });
        const sharedLesson = await Lesson.create({ title: "Shared", description: "d", content: "c", module: modA._id });
        await Module.create({ title: "MB", description: "d", content: "c", course: courseB._id, lesson: [sharedLesson._id] });
        expect((await request(app).put(`/api/lessons/${sharedLesson._id}`).set("Authorization", `Bearer ${tokenA}`).send({ title: "Edit" })).statusCode).toBe(403);
        expect((await request(app).delete(`/api/lessons/${sharedLesson._id}`).set("Authorization", `Bearer ${tokenA}`)).statusCode).toBe(403);

        await User.create({ name: "Upper", email: "Case@example.com", password: "hashed", role: "student" });
        await User.create({ name: "Lower", email: "case@example.com", password: "hashed", role: "student" });
        const upperDoc = await User.findOne({ email: "Case@example.com" });
        const upperToken = jwt.sign({ id: upperDoc._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "1d" });
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${upperToken}`).send({ email: "CASE@example.com" })).statusCode).toBe(400);

        const over72 = `${"a".repeat(70)}!1A`;
        expect((await request(app).post("/api/admin/users").set("Authorization", `Bearer ${superToken}`)
            .send({ name: "Long Pw", email: "longpw@example.com", role: "instructor", temporaryPassword: over72, sendEmail: false })).statusCode).toBe(400);
    });

    it("rechecks in-lock actor roles, defers audit logs until commit, and serializes self-enroll", async () => {
        const { user: adminUser, token: adminToken } = await createAndLoginUser({ name: "Demoted Admin", email: "admin-inv@example.com", role: "admin" });
        const { user: instA } = await createAndLoginUser({ name: "Inst A2", email: "insta2@example.com", role: "instructor" });
        const { user: stu, token: stuToken } = await createAndLoginUser({ name: "Stu", email: "stu-inv@example.com", role: "student" });
        const courseA = await Course.create({ title: "Course Lock", description: "d", instructor: instA._id });

        const origAcquire = GovernanceLock.findOneAndUpdate;
        const mockLockDemote = () => jest.spyOn(GovernanceLock, "findOneAndUpdate").mockImplementationOnce(async function (filter, ...args) {
            await User.updateOne({ _id: adminUser._id }, { $set: { role: "student" } });
            return origAcquire.call(this, filter, ...args);
        });
        let demoteHook = mockLockDemote();
        try {
            expect((await request(app).put(`/api/courses/${courseA._id}`).set("Authorization", `Bearer ${adminToken}`).send({ title: "Nope" })).statusCode).toBe(403);
        } finally {
            demoteHook.mockRestore();
        }
        await User.updateOne({ _id: adminUser._id }, { $set: { role: "admin" } });
        demoteHook = mockLockDemote();
        try {
            expect((await request(app).post(`/api/admin/courses/${courseA._id}/enrollments`).set("Authorization", `Bearer ${adminToken}`).send({ userId: stu._id.toString() })).statusCode).toBe(403);
        } finally {
            demoteHook.mockRestore();
        }

        const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
        try {
            await expect(withGovernanceLock("audit-rollback-test", async () => {
                await recordAudit({ req: { user: { _id: stu._id }, ip: "127.0.0.1", id: "req-1" }, action: "ROLE_UPDATED", targetType: "User", targetId: stu._id });
                await new Promise((resolve) => setTimeout(resolve, 60));
            }, { leaseMs: 40 })).rejects.toMatchObject({ statusCode: 409 });
            expect(infoSpy.mock.calls.some(([msg]) => String(msg).startsWith("Audit:"))).toBe(false);
            expect(await AuditLog.countDocuments({})).toBe(0);
        } finally {
            infoSpy.mockRestore();
        }

        expect((await request(app).post(`/api/courses/${courseA._id}/enroll`).set("Authorization", `Bearer ${stuToken}`)).statusCode).toBe(201);
        expect(await Enrollment.countDocuments({ user: stu._id, course: courseA._id })).toBe(1);
    });

    it("reconciles course progress when a module with completed lessons is removed", async () => {
        const { user: inst, token: instToken } = await createAndLoginUser({ name: "Inst Prog", email: "inst-prog@example.com", role: "instructor" });
        const { user: stu, token: stuToken } = await createAndLoginUser({ name: "Stu Prog", email: "stu-prog@example.com", role: "student" });
        const course = await Course.create({ title: "Prog Course", description: "d", instructor: inst._id });
        const mod1 = await Module.create({ title: "M1", description: "d", content: "c", course: course._id });
        const mod2 = await Module.create({ title: "M2", description: "d", content: "c", course: course._id });
        const les1 = await Lesson.create({ title: "L1", description: "d", content: "c", module: mod1._id });
        const les2 = await Lesson.create({ title: "L2", description: "d", content: "c", module: mod2._id });
        await Module.updateOne({ _id: mod1._id }, { $set: { lesson: [les1._id] } });
        await Module.updateOne({ _id: mod2._id }, { $set: { lesson: [les2._id] } });
        await Course.updateOne({ _id: course._id }, { $set: { modules: [mod1._id, mod2._id] } });
        await Enrollment.create({ user: stu._id, course: course._id });
        await Progress.create({ user: stu._id, course: course._id, lesson: les1._id, completed: true });

        const beforeRes = await request(app).get(`/api/courses/${course._id}/progress`).set("Authorization", `Bearer ${stuToken}`);
        expect(beforeRes.statusCode).toBe(200);
        expect(beforeRes.body.percentage).toBe(50);

        expect((await request(app).put(`/api/courses/${course._id}`).set("Authorization", `Bearer ${instToken}`).send({ modules: [mod2._id.toString()] })).statusCode).toBe(200);

        const afterRes = await request(app).get(`/api/courses/${course._id}/progress`).set("Authorization", `Bearer ${stuToken}`);
        expect(afterRes.statusCode).toBe(200);
        expect(afterRes.body.completedCount).toBe(0);
        expect(afterRes.body.totalLessons).toBe(1);
        expect(afterRes.body.percentage).toBe(0);
        expect(await Progress.countDocuments({ user: stu._id, course: course._id })).toBe(0);
    });

    it("rejects blank profile fields, concurrent password races, and shared-module mutations", async () => {
        const { user: stu, token: stuToken } = await createAndLoginUser({ name: "Race Stu", email: "race-stu@example.com", role: "student" });
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${stuToken}`).send({ name: "   " })).statusCode).toBe(400);
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${stuToken}`).send({ email: "   " })).statusCode).toBe(400);

        const origCompare = bcrypt.compare;
        const raceSpy = jest.spyOn(bcrypt, "compare").mockImplementationOnce(async (pw, hash) => {
            await User.updateOne({ _id: stu._id }, { $inc: { tokenVersion: 1 } });
            return origCompare(pw, hash);
        });
        try {
            const raceRes = await request(app).patch("/api/users/me").set("Authorization", `Bearer ${stuToken}`)
                .send({ currentPassword: "Password123!", password: "NewPassword123!" });
            expect(raceRes.statusCode).toBe(409);
        } finally {
            raceSpy.mockRestore();
        }

        const { user: instA, token: tokenA } = await createAndLoginUser({ name: "Inst Shared A", email: "shared-a@example.com", role: "instructor" });
        const { user: instB } = await createAndLoginUser({ name: "Inst Shared B", email: "shared-b@example.com", role: "instructor" });
        const courseA = await Course.create({ title: "Shared CA", description: "d", instructor: instA._id });
        const mod = await Module.create({ title: "Shared M", description: "d", content: "c", course: courseA._id });
        const lesson = await Lesson.create({ title: "Shared L", description: "d", content: "c", module: mod._id });
        await Course.create({ title: "Shared CB", description: "d", instructor: instB._id, modules: [mod._id] });

        expect((await request(app).put(`/api/modules/${mod._id}`).set("Authorization", `Bearer ${tokenA}`).send({ title: "Hijack" })).statusCode).toBe(403);
        expect((await request(app).put(`/api/lessons/${lesson._id}`).set("Authorization", `Bearer ${tokenA}`).send({ title: "Hijack" })).statusCode).toBe(403);

        // Atomic create-and-attach appends module to Course.modules
        const createdModRes = await request(app).post("/api/modules").set("Authorization", `Bearer ${tokenA}`)
            .send({ title: "Attached", description: "d", content: "c", course: courseA._id.toString() });
        expect(createdModRes.statusCode).toBe(201);
        expect((await Course.findById(courseA._id)).modules.map(String)).toContain(createdModRes.body._id);
    });

    it("handles legacy missing tokenVersion, lesson-course completion check, holder reads, and detached lesson progress", async () => {
        const { user: legacyUser, token: legacyToken } = await createAndLoginUser({ name: "Legacy", email: "legacy-tv@example.com", role: "student" });
        await User.collection.updateOne({ _id: legacyUser._id }, { $unset: { tokenVersion: "" } });
        expect((await request(app).patch("/api/users/me").set("Authorization", `Bearer ${legacyToken}`)
            .send({ currentPassword: "Password123!", password: "NewPassword123!" })).statusCode).toBe(200);

        const { user: inst } = await createAndLoginUser({ name: "Inst H", email: "inst-holder@example.com", role: "instructor" });
        const { user: stu, token: stuToken } = await createAndLoginUser({ name: "Stu H", email: "stu-holder@example.com", role: "student" });
        const cA = await Course.create({ title: "CA", description: "d", instructor: inst._id });
        const cB = await Course.create({ title: "CB", description: "d", instructor: inst._id });
        const mod = await Module.create({ title: "MH", description: "d", content: "c", course: cA._id });
        const les = await Lesson.create({ title: "LH", description: "d", content: "c", module: mod._id });
        await Module.updateOne({ _id: mod._id }, { $set: { lesson: [les._id] } });
        await Course.updateOne({ _id: cB._id }, { $set: { modules: [mod._id] } });
        await Enrollment.create({ user: stu._id, course: cB._id });

        expect((await request(app).get(`/api/modules/${mod._id}`).set("Authorization", `Bearer ${stuToken}`)).statusCode).toBe(200);
        expect((await request(app).get(`/api/lessons/${les._id}`).set("Authorization", `Bearer ${stuToken}`)).statusCode).toBe(200);

        const cOther = await Course.create({ title: "Other", description: "d", instructor: inst._id });
        await Enrollment.create({ user: stu._id, course: cOther._id });
        expect((await request(app).post(`/api/lessons/${les._id}/complete`).set("Authorization", `Bearer ${stuToken}`)
            .send({ courseId: cOther._id.toString() })).statusCode).toBe(400);

        expect((await request(app).post(`/api/lessons/${les._id}/complete`).set("Authorization", `Bearer ${stuToken}`)
            .send({ courseId: cB._id.toString() })).statusCode).toBe(200);
        const { token: instToken } = await createAndLoginUser({ name: "Admin H", email: "admin-h@example.com", role: "admin" });
        expect((await request(app).put(`/api/modules/${mod._id}`).set("Authorization", `Bearer ${instToken}`).send({ lesson: [] })).statusCode).toBe(200);
        expect(await Progress.countDocuments({ user: stu._id, lesson: les._id })).toBe(0);
    });

    it("attaches new lessons atomically, populates enrolled instructors, normalizes courseId, reports 72-byte limit, and isolates post-commit errors", async () => {
        const { user: inst, token: instToken } = await createAndLoginUser({ name: "Inst R", email: "inst-r@example.com", role: "instructor" });
        const { user: stu, token: stuToken } = await createAndLoginUser({ name: "Stu R", email: "stu-r@example.com", role: "student" });
        const course = await Course.create({ title: "CR", description: "d", instructor: inst._id });
        const mod = await Module.create({ title: "MR", description: "d", content: "c", course: course._id });
        await Enrollment.create({ user: stu._id, course: course._id });

        const lesRes = await request(app).post("/api/lessons").set("Authorization", `Bearer ${instToken}`)
            .send({ title: "LR", description: "d", content: "c", module: mod._id.toString() });
        expect(lesRes.statusCode).toBe(201);
        expect((await Module.findById(mod._id)).lesson.map(String)).toContain(lesRes.body._id);

        const myRes = await request(app).get("/api/my-courses").set("Authorization", `Bearer ${stuToken}`);
        expect(myRes.statusCode).toBe(200);
        expect(myRes.body.data[0].course.instructor.name).toBe("Inst R");
        expect(myRes.body.data[0].course.instructor.password).toBeUndefined();
        expect(myRes.body.data[0].course.instructor.email).toBeUndefined();

        const compRes = await request(app).post(`/api/lessons/${lesRes.body._id}/complete`)
            .set("Authorization", `Bearer ${stuToken}`).send({ courseId: course._id.toString().toUpperCase() });
        expect(compRes.statusCode).toBe(200);

        const longRes = await request(app).patch("/api/users/me").set("Authorization", `Bearer ${stuToken}`)
            .send({ currentPassword: "Password123!", password: `Aa1!${"a".repeat(69)}` });
        expect(longRes.statusCode).toBe(400);
        expect(longRes.body.message).toBe("Password must not exceed 72 bytes.");

        const spy = jest.spyOn(logger, "error").mockImplementation(() => {});
        let ranSecond = false;
        const val = await withSuperAdminLock(async () => {
            afterTransactionCommit(() => { throw new Error("boom"); });
            afterTransactionCommit(() => { ranSecond = true; });
            return "ok";
        });
        expect(val).toBe("ok");
        expect(ranSecond).toBe(true);
        spy.mockRestore();
    });

    it("falls back for standalone MongoDB in non-production and still rejects in production", async () => {
        const prevEnv = process.env.NODE_ENV;
        const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
        const txSpy = jest.spyOn(mongoose.connection, "transaction")
            .mockRejectedValue(new Error("Transaction numbers are only allowed on a replica set member or mongos"));
        try {
            process.env.NODE_ENV = "development";
            let postCommitRan = false;
            const res = await withSuperAdminLock(async () => {
                afterTransactionCommit(() => { postCommitRan = true; });
                return "standalone-ok";
            });
            expect(res).toBe("standalone-ok");
            expect(postCommitRan).toBe(true);
            expect((await GovernanceLock.findById("super_admin_mutation"))?.ownerToken).toBeNull();

            process.env.NODE_ENV = "production";
            await expect(withSuperAdminLock(async () => "nope")).rejects.toThrow("Transaction numbers");
            expect((await GovernanceLock.findById("super_admin_mutation"))?.ownerToken).toBeNull();
        } finally {
            process.env.NODE_ENV = prevEnv;
            txSpy.mockRestore();
            warnSpy.mockRestore();
        }
    });
});
