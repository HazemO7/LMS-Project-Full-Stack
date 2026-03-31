const mongoose = require("mongoose");


const courseSchema = new mongoose.Schema(
    {
        modules: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Module"
            }
        ],

        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true });


const Course = mongoose.model("Course", courseSchema);
module.exports = Course;

