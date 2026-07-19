const Course = require("../models/Course");
const logger = require("../utils/logger");


// Create Course

const createCourse = async (req, res) => {
    try {
        const { title, description } = req.body;
        // create new course instance
        const course = new Course({
            title,
            description,
            instructor: req.user._id
        });
        // save course to database
        const savedCourse = await course.save();
        
        logger.info("Course created successfully", { courseId: savedCourse._id, instructorId: req.user._id, requestId: req.id });
        
        // send response
        res.status(201).json({
            status: "success",
            data: savedCourse
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
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

        if (search) {
            query.title = {
                $regex: search,
                $options: "i"
            };
        }

        const totalCourses = await Course.countDocuments(query);

        const courses = await Course.find(query)
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
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// Get Course By ID
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

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
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};


const getCourseByIdFull = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
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
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// Update Course

const updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ status: "fail", message: "Not authorized to update this course" });
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });

        logger.info("Course updated successfully", { courseId: course._id, userId: req.user._id, requestId: req.id });

        res.json({
            status: "success",
            data: course
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// Delete Course
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ status: "fail", message: "Course not found" });
        }

        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ status: "fail", message: "Not authorized to delete this course" });
        }

        await Course.findByIdAndDelete(req.params.id);

        logger.info("Course deleted successfully", { courseId: req.params.id, userId: req.user._id, requestId: req.id });

        res.json({
            status: "success",
            message: "Course deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
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
}
