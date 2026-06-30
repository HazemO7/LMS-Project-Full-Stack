const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authmiddleware');

router.get('/me', protect, userController.getMe);
router.patch('/me', protect, userController.updateMe);
router.patch('/:id/role', protect, authorize('admin'), userController.updateRole);

module.exports = router;
