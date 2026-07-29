const { BdiResponse, Patient } = require('../models');

function getSeverity(totalScore) {
  if (totalScore <= 13) return 'minimal';
  if (totalScore <= 19) return 'mild';
  if (totalScore <= 28) return 'moderate';
  return 'severe';
}

exports.submitQuestionnaire = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Answers are required.' });
    }

    // req.user comes from auth middleware — check it has the user's id (adjust if named differently, e.g. req.user.user_id)
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const total_score = answers.reduce((sum, val) => sum + Number(val), 0);
    const severity = getSeverity(total_score);

    const response = await BdiResponse.create({
      patient_id: patient.id,
      answers_json: answers,
      total_score,
      severity,
    });

    res.json({ total_score: response.total_score, severity: response.severity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error submitting questionnaire.' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const history = await BdiResponse.findAll({
      where: { patient_id: patient.id },
      order: [['taken_at', 'DESC']],
      attributes: ['id', 'total_score', 'severity', 'taken_at'],
    });

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching history.' });
  }
};