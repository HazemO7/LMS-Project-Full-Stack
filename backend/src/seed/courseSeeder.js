const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const User = require("../models/User");

const seedCourses = async () => {
    try {
        const count = await Course.countDocuments();
        if (count > 0) {
            console.log("Courses already seeded.");
            return;
        }

        // Get an instructor (using the admin, since admin role was seeded previously)
        const instructor = await User.findOne({ role: "admin" });
        const instructorId = instructor ? instructor._id : null;

        // Demo courses data 
        // Note: Prices, levels, duration, and images are omitted because they do not exist in the current Course schema.
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

        // Create some lessons for the first course
        const lesson1 = await Lesson.create({
            title: "Introduction to HTML",
            description: "Learn the basic structure of HTML documents.",
            content: "HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages.",
            videoUrl: "https://www.youtube.com/watch?v=placeholder1"
        });
        const lesson2 = await Lesson.create({
            title: "CSS Styling Basics",
            description: "Learn how to style your HTML elements using CSS.",
            content: "CSS stands for Cascading Style Sheets. It describes how HTML elements should be displayed on screen.",
            videoUrl: "https://www.youtube.com/watch?v=placeholder2"
        });
        const lesson3 = await Lesson.create({
            title: "JavaScript Fundamentals",
            description: "Introduction to programming with JavaScript.",
            content: "JavaScript is a scripting language that enables you to create dynamically updating content.",
            videoUrl: "https://www.youtube.com/watch?v=placeholder3"
        });

        // Create modules and link lessons
        const module1 = await Module.create({
            title: "Module 1: The Basics",
            description: "Getting started with web development fundamentals.",
            content: "This module covers HTML and CSS basics.",
            lesson: [lesson1._id, lesson2._id] // based on Module.js schema 'lesson' field
        });

        const module2 = await Module.create({
            title: "Module 2: Interactivity",
            description: "Adding logic and interactivity with JavaScript.",
            content: "This module introduces JavaScript programming.",
            lesson: [lesson3._id]
        });

        // Assign modules to the first course
        coursesData[0].modules = [module1._id, module2._id];

        // Insert all courses
        await Course.insertMany(coursesData);
        
        console.log("Demo courses inserted successfully.");
    } catch (error) {
        console.error("Error seeding courses:", error);
    }
};

module.exports = seedCourses;
