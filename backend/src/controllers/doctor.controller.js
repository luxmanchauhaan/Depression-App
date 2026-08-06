const { Doctor, Patient, User, BdiResponse, CognitiveResult, SleepLog, WeightLog } = require('../models');

exports.getPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found for this user.' });
    }

    const patients = await Patient.findAll({
      where: { doctor_id: doctor.id },
      include: [
        { model: User, attributes: ['full_name', 'email'] },
        {
          model: BdiResponse,
          separate: true,
          limit: 1,
          order: [['taken_at', 'DESC']],
          attributes: ['total_score', 'severity', 'taken_at'],
        },
      ],
    });

    const result = patients.map((p) => {
      const latest = p.BdiResponses && p.BdiResponses[0];
      return {
        patient_id: p.id,
        full_name: p.User ? p.User.full_name : null,
        email: p.User ? p.User.email : null,
        latest_score: latest ? latest.total_score : null,
        latest_severity: latest ? latest.severity : null,
        last_taken_at: latest ? latest.taken_at : null,
      };
    });

    res.json({ patients: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching patients.' });
  }
};

exports.getPatientCognitiveHistory = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found for this user.' });
    }

    const patient = await Patient.findOne({
      where: { id: req.params.patientId, doctor_id: doctor.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not assigned to you.' });
    }

    const results = await CognitiveResult.findAll({
      where: { patient_id: patient.id },
      order: [['taken_at', 'DESC']],
      attributes: ['id', 'test_type', 'score', 'taken_at'],
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching cognitive history.' });
  }
};

exports.getPatientBdiHistory = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found for this user.' });
    }

    const patient = await Patient.findOne({
      where: { id: req.params.patientId, doctor_id: doctor.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not assigned to you.' });
    }

    const history = await BdiResponse.findAll({
      where: { patient_id: patient.id },
      order: [['taken_at', 'DESC']],
      attributes: ['id', 'total_score', 'severity', 'taken_at'],
    });

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching BDI history.' });
  }
};

exports.getPatientSleepHistory = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found for this user.' });
    }

    const patient = await Patient.findOne({
      where: { id: req.params.patientId, doctor_id: doctor.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not assigned to you.' });
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

exports.getPatientWeightHistory = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found for this user.' });
    }

    const patient = await Patient.findOne({
      where: { id: req.params.patientId, doctor_id: doctor.id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found or not assigned to you.' });
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