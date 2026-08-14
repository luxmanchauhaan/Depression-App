const { SleepLog, WeightLog, MoodLog, EmotionCapture, Patient } = require('../models');

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

async function callEmotionService(imageBase64) {
  const url = `${process.env.AI_SERVICE_URL || 'http://localhost:5001'}/analyze`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Emotion analysis failed');
  }
  return data; // { dominant_emotion, confidence, scores }
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

exports.submitMoodLog = async (req, res) => {
  try {
    const { mood_score, notes, image_base64 } = req.body;

    if (mood_score === undefined || mood_score < 1 || mood_score > 10) {
      return res.status(400).json({ message: 'A valid mood_score (1-10) is required.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const moodLog = await MoodLog.create({
      patient_id: patient.id,
      mood_score,
      notes: notes || null,
    });

    let emotion = null;

    // Photo is optional - a mood log without one is still fully valid.
    if (image_base64) {
      try {
        const analysis = await callEmotionService(image_base64);
        const capture = await EmotionCapture.create({
          patient_id: patient.id,
          mood_log_id: moodLog.id,
          dominant_emotion: analysis.dominant_emotion,
          confidence: analysis.confidence,
          emotion_scores_json: analysis.scores,
        });
        emotion = {
          dominant_emotion: capture.dominant_emotion,
          confidence: capture.confidence,
          scores: analysis.scores,
        };
      } catch (emotionErr) {
        // Don't fail the whole check-in just because the photo step failed
        // (no face detected, AI service down, etc.) - the self-reported
        // mood is still valuable on its own.
        console.error('Emotion analysis error:', emotionErr.message);
        emotion = { error: emotionErr.message };
      }
    }

    res.json({
      id: moodLog.id,
      mood_score: moodLog.mood_score,
      notes: moodLog.notes,
      logged_at: moodLog.logged_at,
      emotion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving mood log.' });
  }
};

exports.getMoodHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const history = await MoodLog.findAll({
      where: { patient_id: patient.id },
      order: [['logged_at', 'DESC']],
      include: [{ model: EmotionCapture, required: false }],
    });

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching mood history.' });
  }
};
