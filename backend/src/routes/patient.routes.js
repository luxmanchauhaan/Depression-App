const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/questionnaire', requireAuth, patientController.submitQuestionnaire);
router.get('/history', requireAuth, patientController.getHistory);
router.get('/recommendations', requireAuth, patientController.getRecommendations);

module.exports = router;