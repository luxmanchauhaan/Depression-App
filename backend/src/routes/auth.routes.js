const express = require('express');
const router = express.Router();
const { signupDoctor, signupPatient, login, getProfile, changePassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/signup/doctor', signupDoctor);
router.post('/signup/patient', signupPatient);
router.post('/login', login);
router.get('/me', requireAuth, getProfile);
router.put('/change-password', requireAuth, changePassword);

module.exports = router;