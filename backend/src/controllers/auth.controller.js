const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, User, Doctor, Patient } = require('../models');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/signup/doctor
async function signupDoctor(req, res) {
  const t = await sequelize.transaction();
  try {
    const { email, password, full_name, doctor_code, specialization } = req.body;
    if (!email || !password || !full_name || !doctor_code) {
      await t.rollback();
      return res.status(400).json({ error: 'email, password, full_name, and doctor_code are required' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, full_name, role: 'doctor' }, { transaction: t });
    const doctor = await Doctor.create({ user_id: user.id, doctor_code, specialization }, { transaction: t });

    await t.commit();

    const token = signToken(user);
    res.status(201).json({ token, doctor_id: doctor.id, doctor_code: doctor.doctor_code });
  } catch (err) {
    await t.rollback();
    console.error('Doctor signup error:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email or doctor code already in use' });
    }
    res.status(500).json({ error: 'Signup failed', detail: err.message });
  }
}

// POST /api/auth/signup/patient
// Patient must supply the doctor_code shared by their doctor.
async function signupPatient(req, res) {
  const t = await sequelize.transaction();
  try {
    const { email, password, full_name, doctor_code, date_of_birth, gender } = req.body;
    if (!email || !password || !full_name || !doctor_code) {
      await t.rollback();
      return res.status(400).json({ error: 'email, password, full_name, and doctor_code are required' });
    }

    const doctor = await Doctor.findOne({ where: { doctor_code }, transaction: t });
    if (!doctor) {
      await t.rollback();
      return res.status(404).json({ error: 'No doctor found with that code' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, full_name, role: 'patient' }, { transaction: t });
    const patient = await Patient.create({
      user_id: user.id,
      doctor_id: doctor.id,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
    }, { transaction: t });

    await t.commit();

    const token = signToken(user);
    res.status(201).json({ token, patient_id: patient.id, linked_doctor_id: doctor.id });
  } catch (err) {
    await t.rollback();
    console.error('Patient signup error:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Signup failed', detail: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, role: user.role, user_id: user.id, full_name: user.full_name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
}

module.exports = { signupDoctor, signupPatient, login };
