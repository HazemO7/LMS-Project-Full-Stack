

const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const enrollmentController = require("../controllers/enrollmentController");
const { protect, authorize } = require("../middleware/authmiddleware");

const enrollmentGuard = require("../middleware/enrollmentGuard");
const { courseOwnershipGuard } = require("../middleware/courseOwnershipGuard");

router.post("/", protect, authorize("super_admin", "admin", "instructor"), courseController.createCourse);
router.get("/", courseController.getCourses);
router.get("/:id/full", protect, enrollmentGuard, courseController.getCourseByIdFull);
router.get("/:id", protect, courseController.getCourseById);
router.put("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("course"), courseController.updateCourse);
router.delete("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("course"), courseController.deleteCourse);
router.post("/:id/enroll", protect, authorize("student"), enrollmentController.enrollCourse);


module.exports = router;