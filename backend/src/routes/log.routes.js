const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/sleep', requireAuth, logController.submitSleepLog);
router.get('/sleep', requireAuth, logController.getSleepHistory);
router.post('/weight', requireAuth, logController.submitWeightLog);
router.get('/weight', requireAuth, logController.getWeightHistory);

module.exports = router;