// import libraryes
const express = require("express")
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const mongoose = require("mongoose");
const logger = require("./src/utils/logger");
const { assignId, requestLogger } = require("./src/middleware/requestLogger");

require("dotenv").config();

app.use(assignId);
app.use(requestLogger);

app.use(helmet({
    crossOriginResourcePolicy: false
}));

app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost",
      "http://localhost:5173"
    ].filter(Boolean),
    credentials: true
  })
);

app.use(express.json());

const port = process.env.PORT || 3000;

// import routes
const courseRoutes = require("./src/routes/courseRoutes");
const moduleRoutes = require("./src/routes/moudleRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const authRoutes = require("./src/routes/authRouters");
const userRoutes = require("./src/routes/userRoutes");

// import error middleware
const globalErrorHandler = require("./src/middleware/errorMiddleware");

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

logger.info("Registered routes successfully");

const seedAll = require("./src/seed/index");

// data base connection 
async function DBconnected() {
    try {
        const dbUrl = process.env.DB_URL || process.env.MONGO_URI;
        if (!dbUrl) {
            throw new Error("DB_URL is not configured");
        }

        await mongoose.connect(dbUrl)
        logger.info("Data Base Connected");
        await seedAll(); // run the seed orchestrator
    } catch (error) {
        logger.error("error in connction Data Base: " + error.message, { stack: error.stack });
    }
}

// Register Error Middleware as the last middleware
app.use(globalErrorHandler);

//port listen
if (require.main === module) {
    DBconnected();
    app.listen(port, () => {
        logger.info(`server is listning on port ${port}`);
    });
}

module.exports = app;
