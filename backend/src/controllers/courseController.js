const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const User = require("../models/User");
const { isAdminRole } = require("../middleware/authmiddleware");
const logger = require("../utils/logger");

const PUBLIC_INSTRUCTOR_FIELDS = "name specialty bio";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create Course

const createCourse = async (req, res) => {
    try {
        const { title, description, instructor: requestedInstructorId } = req.body;
        let instructorId = req.user._id;

        if (requestedInstructorId && isAdminRole(req.user.role)) {
            if (!isValidObjectId(requestedInstructorId)) {
                return res.status(400).json({
                    status: "fail",
                    message: "Selected instructor is invalid or inactive",
                });
            }
            const targetInstructor = await User.findById(requestedInstructorId);
            if (
                !targetInstructor ||
                targetInstructor.isActive === false ||
                !["instructor", "admin", "super_admin"].includes(targetInstructor.role)
            ) {
                return res.status(400).json({
                    status: "fail",
                    message: "Selected instructor is invalid or inactive",
                });
            }
            instructorId = targetInstructor._id;
        }

        // create new course instance
        const course = new Course({
            title,
            description,
            instructor: instructorId
        });
        // save course to database
        const savedCourse = await course.save();
        await savedCourse.populate("instructor", PUBLIC_INSTRUCTOR_FIELDS);

        logger.info("Course created successfully", { courseId: savedCourse._id, instructorId, requestId: req.id });

        // send response
        res.status(201).json({
            status: "success",
            data: savedCourse
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        logger.error("Create course error", { error: error.message, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to create course"
        });
    }
};


// Get All Courses

const getCourses = async (req, res) => {
    try {
        let { page = 1, limit = 6, search = "" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 6;

        const skip = (page - 1) * limit;

        const query = {};

        if (search && String(search).trim()) {
            query.title = {
                $regex: escapeRegex(String(search).trim()),
                $options: "i"
            };
        }

        const totalCourses = await Course.countDocuments(query);

        const courses = await Course.find(query)
            .populate("instructor", PUBLIC_INSTRUCTOR_FIELDS)
            .skip(skip)
            .limit(limit);

        res.json({
            status: "success",
            page,
            limit,
            totalCourses,
            totalPages: Math.ceil(totalCourses / limit),
            results: courses.length,
            data: courses
        });

    } catch (error) {
        logger.error("Get courses error", { error: error.message, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to load courses"
        });
    }
};

// Get Course By ID
const getCourseById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid course ID"
            });
        }

        const course = await Course.findById(req.params.id)
            .populate("instructor", PUBLIC_INSTRUCTOR_FIELDS);

        if (!course) {
            return res.status(404).json({
                status: "fail",
                message: "Course not found"
            });
        }

        res.json({
            status: "success",
            data: course
        });

    } catch (error) {
        logger.error("Get course by ID error", { error: error.message, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to load course"
        });
    }
};


const getCourseByIdFull = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid course ID"
            });
        }

        const course = await Course.findById(req.params.id)
            .populate("instructor", PUBLIC_INSTRUCTOR_FIELDS)
            .populate({
                path: 'modules',
                populate: {
                    path: 'lesson',
                    model: 'Lesson'
                }
            });

        if (!course) {
            return res.status(404).json({
                status: "fail",
                message: "Course not found"
            });
        }
        res.json({
            status: "success",
            data: course
        });
    } catch (error) {
        logger.error("Get full course error", { error: error.message, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to load course details"
        });
    }
};

// Update Course

const updateCourse = async (req, res) => {
    try {
        let course = req.course || await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }
        if (course.instructor?.toString() !== req.user._id.toString() && !isAdminRole(req.user.role)) {
            return res.status(403).json({ status: "fail", message: "Not authorized to update this course" });
        }

        const updateFields = {};
        if (req.body.title !== undefined) updateFields.title = req.body.title;
        if (req.body.description !== undefined) updateFields.description = req.body.description;

        let uniqueModuleIds = null;
        if (req.body.modules !== undefined) {
            if (!Array.isArray(req.body.modules)) {
                return res.status(400).json({ status: "fail", message: "Modules must be an array of IDs" });
            }

            uniqueModuleIds = [];
            const seen = new Set();
            for (const rawId of req.body.modules) {
                const idStr = String(rawId);
                if (!isValidObjectId(idStr)) {
                    return res.status(400).json({ status: "fail", message: "Invalid module ID provided" });
                }
                if (!seen.has(idStr)) {
                    seen.add(idStr);
                    uniqueModuleIds.push(idStr);
                }
            }

            if (uniqueModuleIds.length > 0) {
                const requestedModules = await Module.find({ _id: { $in: uniqueModuleIds } }).select("_id course");
                if (requestedModules.length !== uniqueModuleIds.length) {
                    return res.status(404).json({ status: "fail", message: "One or more modules were not found" });
                }

                const otherCourses = await Course.find({
                    _id: { $ne: course._id },
                    modules: { $in: uniqueModuleIds },
                }).select("_id");

                if (!isAdminRole(req.user.role)) {
                    const existingModuleIdSet = new Set((course.modules || []).map((id) => id.toString()));
                    const hasForeignModule =
                        otherCourses.length > 0 ||
                        requestedModules.some((mod) => {
                            if (mod.course) {
                                return mod.course.toString() !== course._id.toString();
                            }
                            return !existingModuleIdSet.has(mod._id.toString());
                        });

                    if (hasForeignModule) {
                        return res.status(403).json({
                            status: "fail",
                            message: "Not authorized to attach modules from another course",
                        });
                    }
                }
            }

            updateFields.modules = uniqueModuleIds;
        }

        if (uniqueModuleIds && uniqueModuleIds.length > 0 && isAdminRole(req.user.role)) {
            await Course.updateMany(
                { _id: { $ne: course._id }, modules: { $in: uniqueModuleIds } },
                { $pull: { modules: { $in: uniqueModuleIds } } }
            );
        }

        course = await Course.findByIdAndUpdate(req.params.id, updateFields, { new: true })
            .populate("instructor", PUBLIC_INSTRUCTOR_FIELDS);

        if (uniqueModuleIds && uniqueModuleIds.length > 0) {
            await Module.updateMany(
                { _id: { $in: uniqueModuleIds } },
                { $set: { course: course._id } }
            );
        }

        logger.info("Course updated successfully", { courseId: course._id, userId: req.user._id, requestId: req.id });

        res.json({
            status: "success",
            data: course
        });

    } catch (error) {
        logger.error("Update course error", { error: error.message, courseId: req.params.id, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to update course"
        });
    }
};

// Delete Course
const deleteCourse = async (req, res) => {
    try {
        const course = req.course || await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }

        if (course.instructor?.toString() !== req.user._id.toString() && !isAdminRole(req.user.role)) {
            return res.status(403).json({ status: "fail", message: "Not authorized to delete this course" });
        }

        const courseModules = await Module.find({
            $or: [{ course: course._id }, { _id: { $in: course.modules || [] } }],
        }).select("_id lesson");

        const moduleIds = courseModules.map((m) => m._id);
        const lessonIds = courseModules.flatMap((m) => (Array.isArray(m.lesson) ? m.lesson : []));

        if (moduleIds.length > 0 || lessonIds.length > 0) {
            await Lesson.deleteMany({
                $or: [
                    ...(moduleIds.length > 0 ? [{ module: { $in: moduleIds } }] : []),
                    ...(lessonIds.length > 0 ? [{ _id: { $in: lessonIds } }] : []),
                ],
            });
        }
        if (moduleIds.length > 0) {
            await Module.deleteMany({ _id: { $in: moduleIds } });
        }

        await Enrollment.deleteMany({ course: course._id });
        await Progress.deleteMany({ course: course._id });
        await Course.findByIdAndDelete(course._id);

        logger.info("Course deleted successfully", { courseId: req.params.id, userId: req.user._id, requestId: req.id });

        res.json({
            status: "success",
            message: "Course deleted successfully"
        });

    } catch (error) {
        logger.error("Delete course error", { error: error.message, courseId: req.params.id, requestId: req.id });
        res.status(500).json({
            status: "error",
            message: "Failed to delete course"
        });
    }
};



module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    getCourseByIdFull,
    updateCourse,
    deleteCourse,
};
