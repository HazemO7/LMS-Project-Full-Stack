const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authmiddleware');

router.post('/:id/complete', protect, progressController.completeLesson);
router.get('/:id', protect, progressController.getCourseProgress);

module.exports = router;
