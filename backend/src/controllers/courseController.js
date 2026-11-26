const Course = require("../models/Course");
const User = require("../models/User");
const { isAdminRole } = require("../middleware/authmiddleware");
const { withGovernanceLock } = require("../services/governanceLockService");
const {
    PUBLIC_INSTRUCTOR_FIELDS,
    isValidObjectId,
    parseIdList,
    executeCourseUpdate,
    executeCourseDelete,
} = require("../services/curriculumService");
const logger = require("../utils/logger");

const INSTRUCTOR_ROLES = new Set(["instructor", "admin", "super_admin"]);
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const INVALID_INSTRUCTOR_ERROR = {
    status: 400,
    body: { status: "fail", message: "Selected instructor is invalid or inactive" },
};

const buildPublicInstructor = (userDoc) => {
    if (!userDoc) return null;
    return {
        _id: userDoc._id,
        name: userDoc.name,
        specialty: userDoc.specialty || "",
        bio: userDoc.bio || "",
    };
};

const isEligibleInstructor = (userDoc) => {
    if (!userDoc) return false;
    if (userDoc.isActive === false) return false;
    return INSTRUCTOR_ROLES.has(userDoc.role);
};

const resolveCourseInstructor = async (req) => {
    const requestedId = req.body.instructor;
    if (!requestedId) return { instructorDoc: req.user };
    if (!isAdminRole(req.user.role)) return { instructorDoc: req.user };
    if (!isValidObjectId(requestedId)) return { error: INVALID_INSTRUCTOR_ERROR };

    const target = await User.findById(requestedId).select(PUBLIC_INSTRUCTOR_FIELDS + " role isActive");
    if (!isEligibleInstructor(target)) return { error: INVALID_INSTRUCTOR_ERROR };
    return { instructorDoc: target };
};

// Create Course
const createCourse = async (req, res) => {
    try {
        const { error, instructorDoc } = await resolveCourseInstructor(req);
        if (error) return res.status(error.status).json(error.body);

        const { title, description } = req.body;
        const savedCourse = await Course.create({ title, description, instructor: instructorDoc._id });
        const responseData = savedCourse.toObject();
        responseData.instructor = buildPublicInstructor(instructorDoc);

        logger.info("Course created successfully", { courseId: savedCourse._id, instructorId: instructorDoc._id, requestId: req.id });
        return res.status(201).json({ status: "success", data: responseData });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        logger.error("Create course error", { error: error.message, requestId: req.id });
        return res.status(500).json({ status: "error", message: "Failed to create course" });
    }
};

const parsePositivePageParam = (raw, fallback) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return fallback;
    return parsed < 1 ? fallback : parsed;
};

// Get All Courses
const getCourses = async (req, res) => {
    try {
        const page = parsePositivePageParam(req.query.page, 1);
        const limit = parsePositivePageParam(req.query.limit, 6);
        const skip = (page - 1) * limit;

        const query = {};
        const searchTerm = req.query.search ? String(req.query.search).trim() : "";
        if (searchTerm) {
            query.title = { $regex: escapeRegex(searchTerm), $options: "i" };
        }

        const [totalCourses, courses] = await Promise.all([
            Course.countDocuments(query),
            Course.find(query).populate("instructor", PUBLIC_INSTRUCTOR_FIELDS).skip(skip).limit(limit),
        ]);

        return res.json({
            status: "success",
            page,
            limit,
            totalCourses,
            totalPages: Math.ceil(totalCourses / limit),
            results: courses.length,
            data: courses,
        });
    } catch (error) {
        logger.error("Get courses error", { error: error.message, requestId: req.id });
        return res.status(500).json({ status: "error", message: "Failed to load courses" });
    }
};

const fetchAndSendCourseById = async (req, res, includeModules) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }

        let query = Course.findById(req.params.id).populate("instructor", PUBLIC_INSTRUCTOR_FIELDS);
        if (includeModules) {
            query = query.populate({
                path: "modules",
                populate: { path: "lesson", model: "Lesson" },
            });
        }

        const course = await query;
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }
        return res.json({ status: "success", data: course });
    } catch (error) {
        logger.error("Get course error", { error: error.message, includeModules, requestId: req.id });
        return res.status(500).json({ status: "error", message: "Failed to load course" });
    }
};

const getCourseById = (req, res) => fetchAndSendCourseById(req, res, false);
const getCourseByIdFull = (req, res) => fetchAndSendCourseById(req, res, true);

const buildCourseUpdateFields = (body, uniqueModuleIds) => {
    const updateFields = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (uniqueModuleIds !== null) updateFields.modules = uniqueModuleIds;
    return updateFields;
};

const handleCourseMutationError = (res, req, actionLabel, error) => {
    if (error && error.isOperational) {
        return res.status(error.statusCode).json({ status: "fail", message: error.message });
    }
    logger.error(`${actionLabel} error`, { error: error?.message, courseId: req.params.id, requestId: req.id });
    return res.status(500).json({ status: "error", message: `Failed to ${actionLabel.toLowerCase()}` });
};

const runCourseMutation = async (req, res, actionLabel, mutationFn, buildSuccessBody) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ status: "fail", message: "Invalid course ID" });
        }

        const outcome = await withGovernanceLock("curriculum_mutation", mutationFn);
        if (outcome.status !== 200) {
            return res.status(outcome.status).json(outcome.body);
        }

        logger.info(`Course ${actionLabel} succeeded`, { courseId: req.params.id, userId: req.user._id, requestId: req.id });
        return res.json(buildSuccessBody(outcome));
    } catch (error) {
        return handleCourseMutationError(res, req, actionLabel, error);
    }
};

// Update Course
const updateCourse = (req, res) => {
    const { error, uniqueIds } = parseIdList(
        req.body.modules,
        "Modules must be an array of IDs",
        "Invalid module ID provided",
        true
    );
    if (error) return res.status(error.status).json(error.body);

    const updateFields = buildCourseUpdateFields(req.body, uniqueIds);
    return runCourseMutation(
        req,
        res,
        "Update course",
        () => executeCourseUpdate(req, updateFields, uniqueIds),
        (outcome) => ({ status: "success", data: outcome.data })
    );
};

// Delete Course
const deleteCourse = (req, res) =>
    runCourseMutation(
        req,
        res,
        "Delete course",
        () => executeCourseDelete(req),
        () => ({ status: "success", message: "Course deleted successfully" })
    );

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    getCourseByIdFull,
    updateCourse,
    deleteCourse,
};
