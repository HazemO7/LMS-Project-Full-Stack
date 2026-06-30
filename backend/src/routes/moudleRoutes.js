const experss = require("express");
const router = experss.Router();

const moduleController = require("../controllers/moduleController");
const { protect, authorize } = require("../middleware/authmiddleware");

router.post("/", protect, authorize("admin", "instructor"), moduleController.createModule);
router.get("/", moduleController.getModules);
router.get("/:id", moduleController.getModuleById);
router.put("/:id", protect, authorize("admin", "instructor"), moduleController.updateModule);
router.delete("/:id", protect, authorize("admin", "instructor"), moduleController.deleteModule);

module.exports = router;