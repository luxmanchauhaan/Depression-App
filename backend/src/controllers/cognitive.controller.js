const { CognitiveResult, Patient } = require('../models');

exports.submitResult = async (req, res) => {
  try {
    const { test_type, score, details } = req.body;

    const validTypes = ['memory', 'attention', 'processing_speed', 'executive_function', 'visual_memory'];
    if (!test_type || !validTypes.includes(test_type)) {
      return res.status(400).json({ message: 'Valid test_type is required.' });
    }
    if (score === undefined || score === null || Number(score) < 0) {
      return res.status(400).json({ message: 'A valid score is required.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const result = await CognitiveResult.create({
      patient_id: patient.id,
      test_type,
      score,
      details_json: details || null,
    });

    res.json({ id: result.id, test_type: result.test_type, score: result.score, taken_at: result.taken_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving test result.' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const results = await CognitiveResult.findAll({
      where: { patient_id: patient.id },
      order: [['taken_at', 'DESC']],
      attributes: ['id', 'test_type', 'score', 'taken_at'],
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching results.' });
  }
};