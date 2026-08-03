const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/patients', requireAuth, requireRole('doctor'), doctorController.getPatients);
router.get('/patients/:patientId/cognitive-history', requireAuth, requireRole('doctor'), doctorController.getPatientCognitiveHistory);

module.exports = router;