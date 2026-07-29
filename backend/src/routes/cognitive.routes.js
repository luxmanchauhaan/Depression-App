const express = require('express');
const router = express.Router();
const cognitiveController = require('../controllers/cognitive.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/submit', requireAuth, cognitiveController.submitResult);
router.get('/history', requireAuth, cognitiveController.getHistory);

module.exports = router;