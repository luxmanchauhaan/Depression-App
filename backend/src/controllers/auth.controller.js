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

// GET /api/auth/me
// Returns the logged-in user's profile. For patients, includes date_of_birth,
// gender, and the linked doctor's code/specialization. For doctors, includes
// their own doctor_code/specialization.
async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'full_name', 'role', 'created_at'],
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      member_since: user.created_at,
    };

    if (user.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: user.id } });
      if (patient) {
        profile.date_of_birth = patient.date_of_birth;
        profile.gender = patient.gender;
        const doctor = await Doctor.findByPk(patient.doctor_id);
        if (doctor) {
          profile.doctor_code = doctor.doctor_code;
          profile.doctor_specialization = doctor.specialization;
        }
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { user_id: user.id } });
      if (doctor) {
        profile.doctor_code = doctor.doctor_code;
        profile.specialization = doctor.specialization;
      }
    }

    res.json(profile);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password are required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

module.exports = { signupDoctor, signupPatient, login, getProfile, changePassword };