const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const { isAdminRole } = require("./authmiddleware");
const logger = require("../utils/logger");

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const UNAUTHORIZED_MSG = "Not authorized to modify this course curriculum";

const isValidObjectId = (id) => {
    if (typeof id !== "string") return false;
    return OBJECT_ID_REGEX.test(id);
};

const isCourseOwner = (course, userId) => {
    if (!course) return false;
    if (!course.instructor) return false;
    return course.instructor.toString() === userId.toString();
};

const assertCanMutateCourse = (course, user) => {
    if (isAdminRole(user.role)) return true;
    return isCourseOwner(course, user._id);
};

const resolveCourseFromModule = async (moduleDoc) => {
    if (!moduleDoc) return null;
    if (moduleDoc.course) {
        return Course.findById(moduleDoc.course);
    }
    return Course.findOne({ modules: moduleDoc._id });
};

const resolveCourseFromLesson = async (lessonDoc) => {
    if (!lessonDoc) return null;
    const mod = lessonDoc.module
        ? await Module.findById(lessonDoc.module)
        : await Module.findOne({ lesson: lessonDoc._id });
    if (!mod) return null;
    return resolveCourseFromModule(mod);
};

const deny = (res, status, message, useFailStatus = false) => {
    const body = useFailStatus ? { status: "fail", message } : { message };
    return res.status(status).json(body);
};

const authorizeParentCourse = async (courseId, req, res, useFailStatus = false) => {
    if (!isValidObjectId(courseId)) {
        return { rejected: deny(res, 400, "Invalid course ID", useFailStatus) };
    }
    const course = await Course.findById(courseId);
    if (!course) {
        return { rejected: deny(res, 404, "Course not found", useFailStatus) };
    }
    if (!assertCanMutateCourse(course, req.user)) {
        return { rejected: deny(res, 403, UNAUTHORIZED_MSG, useFailStatus) };
    }
    return { course };
};

const guardCourseMutation = async (req, res, next) => {
    const { rejected, course } = await authorizeParentCourse(req.params.id, req, res, true);
    if (rejected) return rejected;
    req.course = course;
    return next();
};

const guardDetachedCreate = (req, res, next) => {
    if (!isAdminRole(req.user.role)) {
        return deny(res, 403, UNAUTHORIZED_MSG);
    }
    return next();
};

const guardModuleCreate = async (req, res, next) => {
    if (!req.body.course) return guardDetachedCreate(req, res, next);
    const { rejected, course } = await authorizeParentCourse(req.body.course, req, res);
    if (rejected) return rejected;
    req.course = course;
    return next();
};

const authorizeResourceMutation = async (req, res, next, config) => {
    const resourceId = config.getId(req);
    if (!isValidObjectId(resourceId)) return deny(res, 400, config.invalidMsg);

    const doc = await config.findById(resourceId);
    if (!doc) return deny(res, 404, config.notFoundMsg);

    const course = await config.resolveCourse(doc);
    if (!assertCanMutateCourse(course, req.user)) {
        return deny(res, 403, UNAUTHORIZED_MSG);
    }
    req.course = course;
    req[config.attachKey] = doc;
    return next();
};

const MODULE_MODIFY_CONFIG = {
    getId: (req) => req.params.id,
    invalidMsg: "Invalid module ID",
    notFoundMsg: "Module not found",
    findById: (id) => Module.findById(id),
    resolveCourse: resolveCourseFromModule,
    attachKey: "moduleDoc",
};

const LESSON_CREATE_CONFIG = {
    getId: (req) => req.body.module,
    invalidMsg: "Invalid module ID",
    notFoundMsg: "Module not found",
    findById: (id) => Module.findById(id),
    resolveCourse: resolveCourseFromModule,
    attachKey: "moduleDoc",
};

const LESSON_MODIFY_CONFIG = {
    getId: (req) => req.params.id,
    invalidMsg: "Invalid lesson ID",
    notFoundMsg: "Lesson not found",
    findById: (id) => Lesson.findById(id),
    resolveCourse: resolveCourseFromLesson,
    attachKey: "lessonDoc",
};

const guardModuleModify = (req, res, next) => authorizeResourceMutation(req, res, next, MODULE_MODIFY_CONFIG);

const guardLessonCreate = (req, res, next) => {
    if (!req.body.module) return guardDetachedCreate(req, res, next);
    return authorizeResourceMutation(req, res, next, LESSON_CREATE_CONFIG);
};

const guardLessonModify = (req, res, next) => authorizeResourceMutation(req, res, next, LESSON_MODIFY_CONFIG);

const MUTATION_GUARDS = {
    course: guardCourseMutation,
    module: (req, res, next) => (req.params.id ? guardModuleModify(req, res, next) : guardModuleCreate(req, res, next)),
    lesson: (req, res, next) => (req.params.id ? guardLessonModify(req, res, next) : guardLessonCreate(req, res, next)),
};

/**
 * Ensures only super_admin, admin, or the owning instructor can mutate a course, module, or lesson.
 * Fails closed when parent course ownership cannot be resolved for non-admins.
 */
const courseOwnershipGuard = (resourceType) => {
    const handler = MUTATION_GUARDS[resourceType];
    return async (req, res, next) => {
        try {
            if (!handler) return next();
            return await handler(req, res, next);
        } catch (error) {
            logger.error("Ownership check error", { error: error.message, resourceType, userId: req.user?._id, requestId: req.id });
            return res.status(500).json({ message: "Server error during ownership check" });
        }
    };
};

const resolveReadableModule = async (id) => {
    const mod = await Module.findById(id);
    if (!mod) return { notFoundMessage: "Module not found", course: null };
    return { course: await resolveCourseFromModule(mod) };
};

const resolveReadableLesson = async (id) => {
    const lesson = await Lesson.findById(id);
    if (!lesson) return { notFoundMessage: "Lesson not found", course: null };
    return { course: await resolveCourseFromLesson(lesson) };
};

const READABLE_RESOLVERS = {
    module: resolveReadableModule,
    lesson: resolveReadableLesson,
};

const resolveReadableCourse = async (resourceType, id) => {
    const resolver = READABLE_RESOLVERS[resourceType];
    if (!resolver) return { course: null };
    return resolver(id);
};

const checkStudentReadAccess = async (userId, courseId) => {
    const enrolled = await Enrollment.findOne({ user: userId, course: courseId });
    if (enrolled) return { allowed: true };
    return { allowed: false, message: "You must be enrolled to access this course content" };
};

const checkReadAccess = async (user, course) => {
    if (!course) return { allowed: false, message: "Access denied" };
    if (user.role === "instructor") {
        return isCourseOwner(course, user._id)
            ? { allowed: true }
            : { allowed: false, message: "Access denied" };
    }
    if (user.role === "student") {
        return checkStudentReadAccess(user._id, course._id);
    }
    return { allowed: false, message: "Access denied" };
};

/**
 * Ensures standalone GET /:id for a module or lesson is accessible only to admins,
 * the owning instructor, or an enrolled student.
 */
const curriculumReadGuard = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({ message: `Invalid ${resourceType} ID` });
            }
            if (isAdminRole(req.user.role)) return next();

            const { notFoundMessage, course } = await resolveReadableCourse(resourceType, req.params.id);
            if (notFoundMessage) {
                return res.status(404).json({ message: notFoundMessage });
            }

            const access = await checkReadAccess(req.user, course);
            if (!access.allowed) {
                return res.status(403).json({ message: access.message });
            }
            return next();
        } catch (error) {
            logger.error("Curriculum read check error", { error: error.message, resourceType, userId: req.user?._id, requestId: req.id });
            return res.status(500).json({ message: "Server error during access check" });
        }
    };
};

module.exports = {
    courseOwnershipGuard,
    curriculumReadGuard,
    resolveCourseFromModule,
    resolveCourseFromLesson,
};
