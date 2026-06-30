const experess = require("express");
const router = experess.Router();

const lessonController = require("../controllers/lessonController");
const { protect, authorize } = require("../middleware/authmiddleware");

router.post("/", protect, authorize("admin", "instructor"), lessonController.createLesson);
router.get("/", lessonController.getLessons);
router.get("/:id", lessonController.getLessonById);
router.put("/:id", protect, authorize("admin", "instructor"), lessonController.updateLesson);
router.delete("/:id", protect, authorize("admin", "instructor"), lessonController.deleteLesson);
module.exports = router;