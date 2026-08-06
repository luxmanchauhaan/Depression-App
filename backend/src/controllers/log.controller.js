const { SleepLog, WeightLog, Patient } = require('../models');

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

exports.submitSleepLog = async (req, res) => {
  try {
    const { hours_slept, quality } = req.body;

    if (hours_slept === undefined || hours_slept < 0 || hours_slept > 24) {
      return res.status(400).json({ message: 'A valid hours_slept value is required.' });
    }
    if (!['poor', 'fair', 'good'].includes(quality)) {
      return res.status(400).json({ message: 'Quality must be poor, fair, or good.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const log = await SleepLog.create({
      patient_id: patient.id,
      hours_slept,
      quality,
      logged_date: todayDateOnly(),
    });

    res.json({ id: log.id, hours_slept: log.hours_slept, quality: log.quality, logged_date: log.logged_date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving sleep log.' });
  }
};

exports.getSleepHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const history = await SleepLog.findAll({
      where: { patient_id: patient.id },
      order: [['logged_date', 'DESC']],
    });

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching sleep history.' });
  }
};

exports.submitWeightLog = async (req, res) => {
  try {
    const { weight_kg } = req.body;

    if (weight_kg === undefined || weight_kg <= 0 || weight_kg > 500) {
      return res.status(400).json({ message: 'A valid weight_kg value is required.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const log = await WeightLog.create({
      patient_id: patient.id,
      weight_kg,
      logged_date: todayDateOnly(),
    });

    res.json({ id: log.id, weight_kg: log.weight_kg, logged_date: log.logged_date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving weight log.' });
  }
};

exports.getWeightHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const history = await WeightLog.findAll({
      where: { patient_id: patient.id },
      order: [['logged_date', 'DESC']],
    });

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching weight history.' });
  }
};