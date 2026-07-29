const express = require('express');
const router = express.Router();
const { signupDoctor, signupPatient, login } = require('../controllers/auth.controller');

router.post('/signup/doctor', signupDoctor);
router.post('/signup/patient', signupPatient);
router.post('/login', login);

module.exports = router;
