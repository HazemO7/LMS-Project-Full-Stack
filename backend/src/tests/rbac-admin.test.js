process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key";

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");
const User = require("../models/User");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const PlatformSettings = require("../models/PlatformSettings");
const AuditLog = require("../models/AuditLog");
const seedAdmin = require("../seed/adminSeeder");

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
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    return { user, token: loginRes.body.token, loginRes };
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
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
    ]);
});

describe("Phase 1: 4-Tier RBAC, Super Admin Governance & Ownership Hardening", () => {
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
                sendEmail: false,
            });
        const tempPassword = createRes.body.temporaryPassword;

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

        // Cannot delete last super_admin
        const delSuperRes = await request(app)
            .delete(`/api/admin/users/${superUser._id}`)
            .set("Authorization", `Bearer ${superToken}`);
        expect(delSuperRes.statusCode).toBe(400);

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
});
