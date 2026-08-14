const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/sleep', requireAuth, logController.submitSleepLog);
router.get('/sleep', requireAuth, logController.getSleepHistory);
router.post('/weight', requireAuth, logController.submitWeightLog);
router.get('/weight', requireAuth, logController.getWeightHistory);
router.post('/mood', requireAuth, logController.submitMoodLog);
router.get('/mood', requireAuth, logController.getMoodHistory);


module.exports = router;