const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authmiddleware');
const { validateRequest } = require('../validators/authValidator');
const { updateUserRoleSchema } = require('../validators/adminValidator');

router.get('/me', protect, userController.getMe);
router.patch('/me', protect, userController.updateMe);
router.patch('/:id/role', protect, authorize('super_admin', 'admin'), validateRequest(updateUserRoleSchema), userController.updateRole);

module.exports = router;
