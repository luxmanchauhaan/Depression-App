const { Activity, Patient } = require('../models');

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

const VALID_CATEGORIES = ['yoga', 'meditation', 'music', 'physical_activity'];

// POST /api/activities
// body: { category, title, description?, assigned_date? }
// assigned_date defaults to today if not supplied.
exports.createActivity = async (req, res) => {
  try {
    const { category, title, description, assigned_date, duration_minutes } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'title is required.' });
    }
    let durationValue = null;
    if (duration_minutes !== undefined && duration_minutes !== null && duration_minutes !== '') {
      durationValue = Number(duration_minutes);
      if (!Number.isFinite(durationValue) || durationValue <= 0 || durationValue > 600) {
        return res.status(400).json({ message: 'duration_minutes must be a number between 1 and 600.' });
      }
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const activity = await Activity.create({
      patient_id: patient.id,
      category,
      title: title.trim(),
      description: description ? description.trim() : null,
      assigned_date: assigned_date || todayDateOnly(),
      duration_minutes: durationValue,
    });

    res.status(201).json({
      id: activity.id,
      category: activity.category,
      title: activity.title,
      description: activity.description,
      assigned_date: activity.assigned_date,
      duration_minutes: activity.duration_minutes,
      completed: activity.completed,
      completed_at: activity.completed_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating activity.' });
  }
};

// GET /api/activities?date=YYYY-MM-DD
// Defaults to today's activities if no date is given.
exports.getActivities = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const date = req.query.date || todayDateOnly();

    const activities = await Activity.findAll({
      where: { patient_id: patient.id, assigned_date: date },
      order: [['created_at', 'ASC']],
    });

    res.json({ activities, date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching activities.' });
  }
};

// PATCH /api/activities/:id/complete
// body: { completed: boolean }
exports.setActivityComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const activity = await Activity.findOne({ where: { id, patient_id: patient.id } });
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    activity.completed = !!completed;
    activity.completed_at = completed ? new Date() : null;
    await activity.save();

    res.json({ id: activity.id, completed: activity.completed, completed_at: activity.completed_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating activity.' });
  }
};

// DELETE /api/activities/:id
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const activity = await Activity.findOne({ where: { id, patient_id: patient.id } });
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    await activity.destroy();
    res.json({ message: 'Activity deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting activity.' });
  }
};