const { BdiResponse, Patient } = require('../models');

function getSeverity(totalScore) {
  if (totalScore <= 13) return 'minimal';
  if (totalScore <= 19) return 'mild';
  if (totalScore <= 28) return 'moderate';
  return 'severe';
}

const GENERAL_POINTS = [
  'Maintain a daily routine.',
  'Yoga or physical exercise.',
  'Music therapy \u2014 calming or relaxing audio.',
  'Activities such as gardening or caring for a pet.',
];

const RECOMMENDATIONS = {
  minimal: {
    title: 'Minimal Depression (BDI score 0\u201313)',
    urgent: null,
    points: [
      ...GENERAL_POINTS,
      'Use the app\'s features to build a daily routine.',
      'Build a habit of regular exercise \u2014 yoga, relaxation exercise, or cardio.',
      'Keep a regular sleep schedule.',
      'Rate your mood regularly.',
      'Retake this questionnaire after a week to check for improvement or worsening.',
    ],
    note: 'If your score worsens, follow the steps recommended for that level in this app.',
  },
  mild: {
    title: 'Mild Depression (BDI score 14\u201319)',
    urgent: 'Please consult a psychiatrist.',
    points: [
      ...GENERAL_POINTS,
      'Treatment can be tailored to your preference \u2014 Interpersonal Psychotherapy, Cognitive Behavioural Therapy (CBT), or medication if psychotherapy isn\'t available or needed.',
    ],
  },
  moderate: {
    title: 'Moderate Depression (BDI score 20\u201328)',
    urgent: 'Please consult a psychiatrist \u2014 antidepressant medication may be recommended.',
    points: [
      ...GENERAL_POINTS,
      'Psychotherapy alongside medication can further reduce the impact of the illness on you and the people around you.',
    ],
  },
  severe: {
    title: 'Severe Depression (BDI score above 28)',
    urgent: 'It is strongly recommended that you consult a psychiatrist as soon as possible.',
    points: [
      ...GENERAL_POINTS,
      'Combined treatment is typical \u2014 medication alongside close monitoring for safety, side effects, self-harm risk, nutrition, and self-care.',
      'Other treatment methods may be added, tailored to your needs and progress.',
    ],
    note: 'This app is not a substitute for care at this level \u2014 it becomes a helpful companion again once your depression is better controlled with professional support.',
  },
};

exports.submitQuestionnaire = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Answers are required.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });

    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const total_score = answers.reduce((sum, val) => sum + Number(val), 0);
    const severity = getSeverity(total_score);
    const recommendations = RECOMMENDATIONS[severity];

    const response = await BdiResponse.create({
      patient_id: patient.id,
      answers_json: answers,
      total_score,
      severity,
      recommendations_json: recommendations,
    });

    res.json({
      total_score: response.total_score,
      severity: response.severity,
      recommendations: response.recommendations_json,
    });
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

exports.getRecommendations = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const latest = await BdiResponse.findOne({
      where: { patient_id: patient.id },
      order: [['taken_at', 'DESC']],
    });

    if (!latest) {
      return res.json({ has_score: false });
    }

    res.json({
      has_score: true,
      score: latest.total_score,
      severity: latest.severity,
      recommendations: latest.recommendations_json,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching recommendations.' });
  }
};