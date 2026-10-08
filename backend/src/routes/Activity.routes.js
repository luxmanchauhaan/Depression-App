const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/', requireAuth, activityController.createActivity);
router.get('/', requireAuth, activityController.getActivities);
router.patch('/:id/complete', requireAuth, activityController.setActivityComplete);
router.delete('/:id', requireAuth, activityController.deleteActivity);

module.exports = router;
