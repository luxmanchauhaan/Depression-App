const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/patients', requireAuth, requireRole('doctor'), doctorController.getPatients);

module.exports = router;