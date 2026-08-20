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

// Emotion labels the Python service returns, used to keep aggregation
// order stable regardless of object key ordering.
const EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];

/**
 * Calls callEmotionService once per captured frame (30-second check-in =
 * ~10 frames) and combines the results into a single reading: majority-vote
 * dominant_emotion, confidence averaged across frames that agreed with the
 * majority, and scores averaged across all successful frames. Individual
 * frame failures are tolerated - only a total failure (zero usable frames)
 * throws, matching the error style callers of callEmotionService expect.
 */
async function callEmotionServiceFrames(framesBase64) {
  const settled = await Promise.allSettled(framesBase64.map(callEmotionService));
  const successful = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);

  if (successful.length === 0) {
    const failureReason = settled[0] && settled[0].reason;
    throw new Error(
      (failureReason && failureReason.message) ||
        'Could not detect an emotion from any of the captured frames. Please retake with your face clearly visible and well lit.'
    );
  }

  const voteCounts = {};
  successful.forEach(({ dominant_emotion }) => {
    voteCounts[dominant_emotion] = (voteCounts[dominant_emotion] || 0) + 1;
  });

  let dominant_emotion = EMOTION_LABELS[0];
  let bestVotes = -1;
  EMOTION_LABELS.forEach((label) => {
    const votes = voteCounts[label] || 0;
    if (votes > bestVotes) {
      bestVotes = votes;
      dominant_emotion = label;
    }
  });

  const agreeingFrames = successful.filter((r) => r.dominant_emotion === dominant_emotion);
  const confidence = agreeingFrames.reduce((sum, r) => sum + r.confidence, 0) / agreeingFrames.length;

  const scores = {};
  EMOTION_LABELS.forEach((label) => {
    const total = successful.reduce((sum, r) => sum + (r.scores ? r.scores[label] || 0 : 0), 0);
    scores[label] = Number((total / successful.length).toFixed(4));
  });

  return { dominant_emotion, confidence: Number(confidence.toFixed(4)), scores };
}

function classifyMoodScore(score) {
  if (score >= 7) return 'positive';
  if (score <= 3) return 'negative';
  return 'neutral';
}

const EMOTION_TO_BUCKET = {
  happy: 'positive',
  surprise: 'positive',
  neutral: 'neutral',
  sad: 'negative',
  fear: 'negative',
  disgust: 'negative',
  angry: 'negative',
};

// Only flags a genuine contradiction (positive vs negative) - a positive vs
// neutral difference isn't much of a disagreement and would just be noise.
function buildMismatchPrompt(selfBucket, detectedBucket, dominantEmotion) {
  const opposite =
    (selfBucket === 'positive' && detectedBucket === 'negative') ||
    (selfBucket === 'negative' && detectedBucket === 'positive');

  if (!opposite) return null;

  const selfLabel = selfBucket === 'positive' ? 'good' : 'low';
  return `Based on your answer, you're feeling ${selfLabel} — but your expression looked more ${dominantEmotion}. Is there anything you'd like to share?`;
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

// POST /api/logs/mood
// body: { mood_score: 1-10, notes?: string, frames_base64: string[], self_reported_emotion?: string }
// frames_base64 replaces the old single image_base64 - the app now captures
// ~10 stills over a 30-second window instead of one photo. self_reported_emotion
// is the patient's answer from the 4-question check-in (one of EMOTION_LABELS).
exports.submitMoodLog = async (req, res) => {
  try {
    const { mood_score, notes, frames_base64, self_reported_emotion } = req.body;

    if (mood_score === undefined || mood_score < 1 || mood_score > 10) {
      return res.status(400).json({ message: 'A valid mood_score (1-10) is required.' });
    }
    if (!Array.isArray(frames_base64) || frames_base64.length === 0) {
      return res.status(400).json({ message: 'At least one photo frame is required for mood detection.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    let analysis;
    try {
      analysis = await callEmotionServiceFrames(frames_base64);
    } catch (emotionErr) {
      console.error('Emotion analysis error:', emotionErr.message);
      return res.status(422).json({
        message:
          emotionErr.message ||
          'Could not detect an emotion from that photo. Please retake it with your face clearly visible and well lit.',
      });
    }

    const moodLog = await MoodLog.create({
      patient_id: patient.id,
      mood_score,
      notes: notes || null,
      self_reported_emotion: self_reported_emotion || null,
    });

    const capture = await EmotionCapture.create({
      patient_id: patient.id,
      mood_log_id: moodLog.id,
      dominant_emotion: analysis.dominant_emotion,
      confidence: analysis.confidence,
      emotion_scores_json: analysis.scores,
    });

    const selfBucket = self_reported_emotion
      ? EMOTION_TO_BUCKET[self_reported_emotion] || 'neutral'
      : classifyMoodScore(mood_score);
    const detectedBucket = EMOTION_TO_BUCKET[analysis.dominant_emotion] || 'neutral';
    const mismatchPrompt = buildMismatchPrompt(selfBucket, detectedBucket, analysis.dominant_emotion);

    res.json({
      id: moodLog.id,
      mood_score: moodLog.mood_score,
      notes: moodLog.notes,
      logged_at: moodLog.logged_at,
      emotion: {
        dominant_emotion: capture.dominant_emotion,
        confidence: capture.confidence,
        scores: analysis.scores,
      },
      mismatch_prompt: mismatchPrompt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving mood log.' });
  }
};

// PATCH /api/logs/mood/:id
// Lets the patient add a follow-up note after seeing the mismatch prompt,
// without creating a duplicate mood log entry.
exports.updateMoodLogNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const moodLog = await MoodLog.findOne({ where: { id, patient_id: patient.id } });
    if (!moodLog) {
      return res.status(404).json({ message: 'Mood log not found.' });
    }

    moodLog.notes = notes || null;
    await moodLog.save();

    res.json({ id: moodLog.id, notes: moodLog.notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating notes.' });
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