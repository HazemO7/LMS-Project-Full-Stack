const experess = require("express");
const router = experess.Router();

const lessonController = require("../controllers/lessonController");
const { protect, authorize } = require("../middleware/authmiddleware");
const { courseOwnershipGuard, curriculumReadGuard } = require("../middleware/courseOwnershipGuard");

router.post("/", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("lesson"), lessonController.createLesson);
router.get("/", protect, authorize("super_admin", "admin"), lessonController.getLessons);
router.get("/:id", protect, curriculumReadGuard("lesson"), lessonController.getLessonById);
router.put("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("lesson"), lessonController.updateLesson);
router.delete("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("lesson"), lessonController.deleteLesson);
module.exports = router;