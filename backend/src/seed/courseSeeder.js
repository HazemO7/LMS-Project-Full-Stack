const mongoose = require("mongoose");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const User = require("../models/User");
const { runOptionalTransaction } = require("../services/governanceLockService");

const missingRefFilter = (field) => ({ $or: [{ [field]: null }, { [field]: { $exists: false } }] });

const repairModuleLessons = async (mod) => {
    if (!Array.isArray(mod.lesson) || mod.lesson.length === 0) return 0;
    const res = await Lesson.updateMany(
        { _id: { $in: mod.lesson }, ...missingRefFilter("module") },
        { $set: { module: mod._id } }
    );
    return res.modifiedCount || 0;
};

const repairCourseLinks = async (course) => {
    if (!Array.isArray(course.modules) || course.modules.length === 0) return 0;
    const modRes = await Module.updateMany(
        { _id: { $in: course.modules }, ...missingRefFilter("course") },
        { $set: { course: course._id } }
    );
    let repaired = modRes.modifiedCount || 0;
    const mods = await Module.find({ _id: { $in: course.modules } }).select("_id lesson");
    for (const mod of mods) {
        repaired += await repairModuleLessons(mod);
    }
    return repaired;
};

const repairIncompleteSeedLinks = async () => {
    const courses = await Course.find({ "modules.0": { $exists: true } }).select("_id modules");
    let repaired = 0;
    for (const course of courses) {
        repaired += await repairCourseLinks(course);
    }
    return repaired;
};

const insertDemoCurriculum = async (coursesData) => {
    const firstCourseId = new mongoose.Types.ObjectId();
    const module1Id = new mongoose.Types.ObjectId();
    const module2Id = new mongoose.Types.ObjectId();

    const lesson1 = await Lesson.create({
        module: module1Id,
        title: "Introduction to HTML",
        description: "Learn the basic structure of HTML documents.",
        content: "HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages.",
        videoUrl: "https://www.youtube.com/watch?v=placeholder1"
    });
    const lesson2 = await Lesson.create({
        module: module1Id,
        title: "CSS Styling Basics",
        description: "Learn how to style your HTML elements using CSS.",
        content: "CSS stands for Cascading Style Sheets. It describes how HTML elements should be displayed on screen.",
        videoUrl: "https://www.youtube.com/watch?v=placeholder2"
    });
    const lesson3 = await Lesson.create({
        module: module2Id,
        title: "JavaScript Fundamentals",
        description: "Introduction to programming with JavaScript.",
        content: "JavaScript is a scripting language that enables you to create dynamically updating content.",
        videoUrl: "https://www.youtube.com/watch?v=placeholder3"
    });

    const module1 = await Module.create({
        _id: module1Id,
        course: firstCourseId,
        title: "Module 1: The Basics",
        description: "Getting started with web development fundamentals.",
        content: "This module covers HTML and CSS basics.",
        lesson: [lesson1._id, lesson2._id]
    });

    const module2 = await Module.create({
        _id: module2Id,
        course: firstCourseId,
        title: "Module 2: Interactivity",
        description: "Adding logic and interactivity with JavaScript.",
        content: "This module introduces JavaScript programming.",
        lesson: [lesson3._id]
    });

    coursesData[0]._id = firstCourseId;
    coursesData[0].modules = [module1._id, module2._id];
    await Course.insertMany(coursesData);
};

const seedCourses = async () => {
    try {
        await runOptionalTransaction(async () => {
            const count = await Course.countDocuments();
            if (count > 0) {
                const repaired = await repairIncompleteSeedLinks();
                console.log(repaired > 0 ? "Repaired incomplete seeded course links." : "Courses already seeded.");
                return;
            }

            const instructor = await User.findOne({ role: { $in: ["instructor", "super_admin", "admin"] } });
            const instructorId = instructor ? instructor._id : null;
            const coursesData = [
                {
                    title: "Complete Web Development Bootcamp",
                    description: "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB in this comprehensive bootcamp.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "Advanced React Patterns",
                    description: "Master React by learning advanced design patterns, state management, and performance optimization.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "Python for Data Science",
                    description: "An introduction to Python programming with a focus on data analysis, visualization, and machine learning.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "UI/UX Design Fundamentals",
                    description: "Learn the core principles of user interface and user experience design to create beautiful applications.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "Mastering Node.js and Express",
                    description: "Build scalable and secure RESTful APIs using Node.js, Express, and MongoDB.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "Introduction to Machine Learning",
                    description: "Learn the basics of machine learning algorithms and how to apply them using real-world datasets.",
                    instructor: instructorId,
                    modules: []
                },
                {
                    title: "DevOps for Beginners",
                    description: "Learn Docker, Kubernetes, CI/CD pipelines, and cloud deployment strategies.",
                    instructor: instructorId,
                    modules: []
                }
            ];
            await insertDemoCurriculum(coursesData);
            console.log("Demo courses inserted successfully.");
        });
    } catch (error) {
        console.error("Error seeding courses:", error);
    }
};

module.exports = seedCourses;
