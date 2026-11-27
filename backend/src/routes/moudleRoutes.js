const experss = require("express");
const router = experss.Router();

const moduleController = require("../controllers/moduleController");
const { protect, authorize } = require("../middleware/authmiddleware");
const { courseOwnershipGuard, curriculumReadGuard } = require("../middleware/courseOwnershipGuard");

router.post("/", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("module"), moduleController.createModule);
router.get("/", protect, authorize("super_admin", "admin"), moduleController.getModules);
router.get("/:id", protect, curriculumReadGuard("module"), moduleController.getModuleById);
router.put("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("module"), moduleController.updateModule);
router.delete("/:id", protect, authorize("super_admin", "admin", "instructor"), courseOwnershipGuard("module"), moduleController.deleteModule);

module.exports = router;