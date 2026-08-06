const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/patients', requireAuth, requireRole('doctor'), doctorController.getPatients);
router.get('/patients/:patientId/cognitive-history', requireAuth, requireRole('doctor'), doctorController.getPatientCognitiveHistory);
router.get('/patients/:patientId/bdi-history', requireAuth, requireRole('doctor'), doctorController.getPatientBdiHistory);
router.get('/patients/:patientId/sleep-history', requireAuth, requireRole('doctor'), doctorController.getPatientSleepHistory);
router.get('/patients/:patientId/weight-history', requireAuth, requireRole('doctor'), doctorController.getPatientWeightHistory);

module.exports = router;