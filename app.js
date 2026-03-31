// import libraryes

const express = require("express")
const cors = require("cors");

const app = express();
const mongoose = require("mongoose");


require("dotenv").config();
app.use(cors());
app.use(express.json());


const port = process.env.PORT || 3000;

// import routes
const courseRoutes = require("./src/routes/courseRoutes");
const moduleRoutes = require("./src/routes/moudleRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const authRoutes = require("./src/routes/authRouters");
const userRoutes = require("./src/routes/userRoutes");
// use routes
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);

const enrollmentController = require("./src/controllers/enrollmentController");
const progressController = require("./src/controllers/progressController");
const { protect, authorize } = require("./src/middleware/authmiddleware");

app.get("/api/my-courses", protect, authorize("student"), enrollmentController.getMyCourses);
app.post("/api/lessons/:id/complete", protect, authorize("student"), progressController.completeLesson);
app.get("/api/courses/:id/progress", protect, authorize("student"), progressController.getCourseProgress);
app.use("/api/auth", authRoutes);

console.log("Registered /api/auth successfully");


// data base connection 
async function DBconted() {
    try {
        await mongoose.connect(process.env.DB_URL)
        console.log("Data Base Connected");
    } catch (error) {
        console.log("error in connction Data Base");
    }

}

DBconted();


//port listen
app.listen(port, () => {
    console.log(`server is listning on port ${port}`);
});
