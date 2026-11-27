const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authmiddleware");
const { validateRequest } = require("../validators/authValidator");
const {
    createStaffUserSchema,
    updateUserRoleSchema,
    updateUserStatusSchema,
    transferCourseSchema,
    manualEnrollSchema,
    updatePlatformSettingsSchema,
} = require("../validators/adminValidator");

// All admin routes require authentication and at least admin role
router.use(protect, authorize("super_admin", "admin"));

// Shared Admin + Super Admin capabilities
router.get("/stats", adminController.getStats);
router.get("/users", adminController.getUsers);
router.post("/users", validateRequest(createStaffUserSchema), adminController.createStaffUser);
router.patch("/users/:id/role", validateRequest(updateUserRoleSchema), adminController.updateUserRole);
router.patch("/users/:id/status", validateRequest(updateUserStatusSchema), adminController.updateUserStatus);

router.get("/courses", adminController.getAdminCourses);
router.get("/courses/:id/enrollments", adminController.getCourseEnrollments);
router.post("/courses/:id/enrollments", validateRequest(manualEnrollSchema), adminController.manualEnrollUser);
router.delete("/courses/:id/enrollments/:userId", adminController.manualUnenrollUser);

// Super Admin exclusive governance routes
router.delete("/users/:id", authorize("super_admin"), adminController.deleteUser);
router.patch("/courses/:id/transfer", authorize("super_admin"), validateRequest(transferCourseSchema), adminController.transferCourseOwnership);
router.get("/settings", authorize("super_admin"), adminController.getPlatformSettings);
router.put("/settings", authorize("super_admin"), validateRequest(updatePlatformSettingsSchema), adminController.updatePlatformSettings);
router.get("/audit-logs", authorize("super_admin"), adminController.getAuditLogs);

module.exports = router;
