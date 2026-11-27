const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const { isAdminRole } = require("../middleware/authmiddleware");
const { resolveCourseFromModule } = require("../middleware/courseOwnershipGuard");

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const PUBLIC_INSTRUCTOR_FIELDS = "name specialty bio";

const isValidObjectId = (id) => {
    if (typeof id !== "string") return false;
    return OBJECT_ID_REGEX.test(id);
};

const buildListError = (message, useFailStatus) => ({
    error: { status: 400, body: useFailStatus ? { status: "fail", message } : { message } },
});

const dedupeValidObjectIds = (rawList, itemErrorMsg, useFailStatus) => {
    const uniqueIds = [];
    const seen = new Set();
    for (const rawId of rawList) {
        if (!isValidObjectId(rawId)) return buildListError(itemErrorMsg, useFailStatus);
        const canonicalId = new mongoose.Types.ObjectId(rawId).toString();
        if (!seen.has(canonicalId)) {
            seen.add(canonicalId);
            uniqueIds.push(canonicalId);
        }
    }
    return { uniqueIds };
};

const parseIdList = (rawList, listErrorMsg, itemErrorMsg, useFailStatus = false) => {
    if (rawList === undefined) return { uniqueIds: null };
    if (!Array.isArray(rawList)) return buildListError(listErrorMsg, useFailStatus);
    return dedupeValidObjectIds(rawList, itemErrorMsg, useFailStatus);
};

const isModuleForeignToCourse = (mod, courseIdStr, existingModuleIdSet) => {
    if (mod.course) return mod.course.toString() !== courseIdStr;
    return !existingModuleIdSet.has(mod._id.toString());
};

const hasForeignModules = async (course, requestedModules, uniqueModuleIds, previousModuleIds) => {
    const otherCourses = await Course.find({
        _id: { $ne: course._id },
        modules: { $in: uniqueModuleIds },
    }).select("_id");
    if (otherCourses.length > 0) return true;

    const existingSet = new Set(previousModuleIds);
    const courseIdStr = course._id.toString();
    return requestedModules.some((mod) => isModuleForeignToCourse(mod, courseIdStr, existingSet));
};

const assertCallerCanAttachModules = async (course, uniqueModuleIds, previousModuleIds, user) => {
    if (!uniqueModuleIds || uniqueModuleIds.length === 0) return null;

    const requestedModules = await Module.find({ _id: { $in: uniqueModuleIds } }).select("_id course");
    if (requestedModules.length !== uniqueModuleIds.length) {
        return { status: 404, body: { status: "fail", message: "One or more modules were not found" } };
    }
    if (isAdminRole(user.role)) return null;

    const foreign = await hasForeignModules(course, requestedModules, uniqueModuleIds, previousModuleIds);
    if (foreign) {
        return { status: 403, body: { status: "fail", message: "Not authorized to attach modules from another course" } };
    }
    return null;
};

const detachRemovedModules = async (courseId, uniqueModuleIds, previousModuleIds) => {
    const newModuleSet = new Set(uniqueModuleIds);
    const removedModuleIds = previousModuleIds.filter((id) => !newModuleSet.has(id));
    if (removedModuleIds.length === 0) return;

    await Module.updateMany(
        { _id: { $in: removedModuleIds }, course: courseId },
        { $set: { course: null } }
    );
};

const unlinkModulesFromOtherCourses = async (updatedCourseId, uniqueModuleIds, isAdmin) => {
    if (!isAdmin || uniqueModuleIds.length === 0) return;
    await Course.updateMany(
        { _id: { $ne: updatedCourseId }, modules: { $in: uniqueModuleIds } },
        { $pull: { modules: { $in: uniqueModuleIds } } }
    );
};

const syncCourseModules = async ({ courseId, updatedCourseId, uniqueModuleIds, previousModuleIds, isAdmin }) => {
    if (uniqueModuleIds === null) return;
    if (uniqueModuleIds.length > 0) {
        await Module.updateMany({ _id: { $in: uniqueModuleIds } }, { $set: { course: updatedCourseId } });
    }
    await detachRemovedModules(courseId, uniqueModuleIds, previousModuleIds);
    await unlinkModulesFromOtherCourses(updatedCourseId, uniqueModuleIds, isAdmin);
};

const canModifyCourse = (course, user) => {
    if (isAdminRole(user.role)) return true;
    if (!course.instructor) return false;
    return course.instructor.toString() === user._id.toString();
};

const executeCourseUpdate = async (req, updateFields, uniqueModuleIds) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return { status: 404, body: { status: "fail", message: "Course not found" } };
    }
    if (!canModifyCourse(course, req.user)) {
        return { status: 403, body: { status: "fail", message: "Not authorized to update this course" } };
    }

    const previousModuleIds = (course.modules || []).map((id) => id.toString());
    const attachError = await assertCallerCanAttachModules(course, uniqueModuleIds, previousModuleIds, req.user);
    if (attachError) return attachError;

    const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { returnDocument: "after" }
    ).populate("instructor", PUBLIC_INSTRUCTOR_FIELDS);

    await syncCourseModules({
        courseId: course._id,
        updatedCourseId: updatedCourse._id,
        uniqueModuleIds,
        previousModuleIds,
        isAdmin: isAdminRole(req.user.role),
    });
    return { status: 200, data: updatedCourse };
};

const sharedChildConflict = (child, holder) => ({
    status: 409,
    body: { message: `Cannot delete curriculum while a ${child} is listed by another ${holder}` },
});

const buildLessonDeleteCriteria = async (moduleIds, lessonIds) => {
    const criteria = [];
    if (moduleIds.length > 0) criteria.push({ module: { $in: moduleIds } });
    if (lessonIds.length > 0) criteria.push({ _id: { $in: lessonIds }, module: null });
    if (criteria.length === 0) return { ids: [] };

    const lessons = await Lesson.find({ $or: criteria }).select("_id");
    const ids = lessons.map((lesson) => lesson._id);
    const sharedLesson = ids.length > 0 && await Module.exists({
        _id: { $nin: moduleIds },
        lesson: { $in: ids },
    });
    if (sharedLesson) return { error: sharedChildConflict("lesson", "module") };
    return { ids };
};

const deleteCourseModulesAndLessons = async (course) => {
    const courseModules = await Module.find({
        $or: [
            { course: course._id },
            { _id: { $in: course.modules || [] }, course: null },
        ],
    }).select("_id lesson");

    const moduleIds = courseModules.map((m) => m._id);
    if (moduleIds.length === 0) return null;
    const sharedModule = await Course.exists({
        _id: { $ne: course._id },
        modules: { $in: moduleIds },
    });
    if (sharedModule) return sharedChildConflict("module", "course");

    const lessonIds = courseModules.flatMap((m) => m.lesson || []);
    const { ids, error } = await buildLessonDeleteCriteria(moduleIds, lessonIds);
    if (error) return error;

    if (ids.length > 0) await Lesson.deleteMany({ _id: { $in: ids } });
    await Module.deleteMany({ _id: { $in: moduleIds }, course: { $in: [null, course._id] } });
    return null;
};

const executeCourseDelete = async (req) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return { status: 404, body: { status: "fail", message: "Course not found" } };
    }
    if (!canModifyCourse(course, req.user)) {
        return { status: 403, body: { status: "fail", message: "Not authorized to delete this course" } };
    }

    const conflict = await deleteCourseModulesAndLessons(course);
    if (conflict) return { ...conflict, body: { status: "fail", ...conflict.body } };
    await Enrollment.deleteMany({ course: course._id });
    await Progress.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);
    return { status: 200 };
};

const buildOtherModuleMap = (otherModules) => {
    const map = new Map();
    for (const mod of otherModules) {
        for (const lid of mod.lesson || []) {
            const key = lid.toString();
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(mod);
        }
    }
    return map;
};

const callerOwnsModuleDoc = async (modDoc, userId, courseCache) => {
    if (!modDoc) return false;
    const modKey = modDoc._id.toString();
    if (!courseCache.has(modKey)) {
        courseCache.set(modKey, await resolveCourseFromModule(modDoc));
    }
    const course = courseCache.get(modKey);
    if (!course || !course.instructor) return false;
    return course.instructor.toString() === userId.toString();
};

const checkPointedModuleOwnership = async (pointedModId, ctx) => {
    if (!pointedModId || pointedModId === ctx.existingModuleId) return true;
    const sourceMod = await Module.findById(pointedModId).select("_id course");
    return callerOwnsModuleDoc(sourceMod, ctx.userId, ctx.courseCache);
};

const checkOtherHoldersOwnership = async (otherHolders, ctx) => {
    for (const holder of otherHolders) {
        const ownsHolder = await callerOwnsModuleDoc(holder, ctx.userId, ctx.courseCache);
        if (!ownsHolder) return false;
    }
    return true;
};

const verifySingleLessonAttachable = async (les, ctx) => {
    const lesIdStr = les._id.toString();
    const otherHolders = ctx.otherModuleMap.get(lesIdStr) || [];
    const pointedModId = les.module ? les.module.toString() : null;

    if (pointedModId === ctx.existingModuleId && otherHolders.length === 0) return true;
    if (!pointedModId && otherHolders.length === 0) {
        return ctx.existingLessonSet.has(lesIdStr);
    }

    const pointedOk = await checkPointedModuleOwnership(pointedModId, ctx);
    if (!pointedOk) return false;
    return checkOtherHoldersOwnership(otherHolders, ctx);
};

const verifyAllLessonsAttachable = async (requestedLessons, ctx) => {
    for (const les of requestedLessons) {
        const allowed = await verifySingleLessonAttachable(les, ctx);
        if (!allowed) {
            return { status: 403, body: { message: "Not authorized to attach lessons from another instructor's course" } };
        }
    }
    return null;
};

const assertCallerCanAttachLessons = async (existingModule, uniqueLessonIds, previousLessonIds, user) => {
    if (!uniqueLessonIds || uniqueLessonIds.length === 0) return null;

    const requestedLessons = await Lesson.find({ _id: { $in: uniqueLessonIds } }).select("_id module");
    if (requestedLessons.length !== uniqueLessonIds.length) {
        return { status: 404, body: { message: "One or more lessons were not found" } };
    }
    if (isAdminRole(user.role)) return null;

    const otherModules = await Module.find({
        _id: { $ne: existingModule._id },
        lesson: { $in: uniqueLessonIds },
    }).select("_id course lesson");

    return verifyAllLessonsAttachable(requestedLessons, {
        existingModuleId: existingModule._id.toString(),
        existingLessonSet: new Set(previousLessonIds),
        otherModuleMap: buildOtherModuleMap(otherModules),
        courseCache: new Map(),
        userId: user._id,
    });
};

const detachRemovedLessons = async (existingModuleId, uniqueLessonIds, previousLessonIds) => {
    const newLessonSet = new Set(uniqueLessonIds);
    const removedLessonIds = previousLessonIds.filter((id) => !newLessonSet.has(id));
    if (removedLessonIds.length === 0) return;

    await Lesson.updateMany(
        { _id: { $in: removedLessonIds }, module: existingModuleId },
        { $set: { module: null } }
    );
};

const syncModuleLessons = async ({ existingModuleId, updatedModuleId, uniqueLessonIds, previousLessonIds }) => {
    if (uniqueLessonIds === null) return;
    if (uniqueLessonIds.length > 0) {
        await Lesson.updateMany({ _id: { $in: uniqueLessonIds } }, { $set: { module: updatedModuleId } });
        await Module.updateMany(
            { _id: { $ne: existingModuleId }, lesson: { $in: uniqueLessonIds } },
            { $pull: { lesson: { $in: uniqueLessonIds } } }
        );
    }
    await detachRemovedLessons(existingModuleId, uniqueLessonIds, previousLessonIds);
};

const MODULE_FORBIDDEN = { status: 403, body: { message: "Not authorized to modify this course curriculum" } };

const moduleOwnershipError = (course, user) => {
    if (isAdminRole(user.role)) return null;
    if (!course) return MODULE_FORBIDDEN;
    if (canModifyCourse(course, user)) return null;
    return MODULE_FORBIDDEN;
};

const authorizeModuleCourseOnCreate = async (courseId, user) => {
    if (!courseId) return isAdminRole(user.role) ? null : MODULE_FORBIDDEN;
    if (!isValidObjectId(courseId)) return { status: 400, body: { message: "Invalid course ID" } };

    const course = await Course.findById(courseId);
    if (!course) return { status: 404, body: { message: "Course not found" } };
    return moduleOwnershipError(course, user);
};

const executeModuleCreate = async (req) => {
    const { title, description, content, course, order } = req.body;
    const authErr = await authorizeModuleCourseOnCreate(course, req.user);
    if (authErr) return authErr;

    const moduleDoc = await Module.create({
        title,
        description,
        content,
        course: course || null,
        order: order ?? 0,
    });
    return { status: 201, module: moduleDoc };
};

const executeModuleUpdate = async (req, updateFields, uniqueLessonIds) => {
    const existingModule = await Module.findById(req.params.id);
    if (!existingModule) return { status: 404, body: { message: "Module not found" } };

    const course = await resolveCourseFromModule(existingModule);
    const ownershipError = moduleOwnershipError(course, req.user);
    if (ownershipError) return ownershipError;

    const previousLessonIds = (existingModule.lesson || []).map((id) => id.toString());
    const attachmentError = await assertCallerCanAttachLessons(existingModule, uniqueLessonIds, previousLessonIds, req.user);
    if (attachmentError) return attachmentError;

    const updatedModule = await Module.findByIdAndUpdate(req.params.id, updateFields, { returnDocument: "after" });
    if (!updatedModule) return { status: 404, body: { message: "Module not found" } };

    await syncModuleLessons({
        existingModuleId: existingModule._id,
        updatedModuleId: updatedModule._id,
        uniqueLessonIds,
        previousLessonIds,
    });
    return { status: 200, module: updatedModule };
};

const isModuleSharedWithOtherCourse = (mod, course) => {
    const ownerCourseId = mod.course || course?._id || null;
    return Course.exists({ _id: { $ne: ownerCourseId }, modules: mod._id });
};

const deleteModuleLessonsAndProgress = async (mod) => {
    const { ids, error } = await buildLessonDeleteCriteria([mod._id], mod.lesson || []);
    if (error) return error;
    if (ids.length > 0) {
        await Progress.deleteMany({ lesson: { $in: ids } });
        await Lesson.deleteMany({ _id: { $in: ids } });
    }
    return null;
};

const executeModuleDelete = async (req) => {
    const mod = await Module.findById(req.params.id);
    if (!mod) return { status: 404, body: { message: "Module not found" } };

    const course = await resolveCourseFromModule(mod);
    const ownershipError = moduleOwnershipError(course, req.user);
    if (ownershipError) return ownershipError;

    const sharedModule = await isModuleSharedWithOtherCourse(mod, course);
    if (sharedModule) return sharedChildConflict("module", "course");

    const deleteError = await deleteModuleLessonsAndProgress(mod);
    if (deleteError) return deleteError;

    await Course.updateMany({ modules: mod._id }, { $pull: { modules: mod._id } });
    await Module.findByIdAndDelete(mod._id);
    return { status: 200, moduleId: mod._id };
};

module.exports = {
    PUBLIC_INSTRUCTOR_FIELDS,
    isValidObjectId,
    parseIdList,
    executeCourseUpdate,
    executeCourseDelete,
    executeModuleCreate,
    executeModuleUpdate,
    executeModuleDelete,
};
