const { Medicine, MedicineLog, Patient } = require('../models');

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

exports.createMedicine = async (req, res) => {
  try {
    const { name, dosage, times, notification_ids } = req.body;

    if (!name || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({ message: 'name and at least one time are required.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const medicine = await Medicine.create({
      patient_id: patient.id,
      name,
      dosage: dosage || null,
      times_json: times,
      notification_ids_json: notification_ids || null,
    });

    res.json({ medicine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating medicine.' });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const medicines = await Medicine.findAll({
      where: { patient_id: patient.id, active: true },
      order: [['created_at', 'DESC']],
    });

    res.json({ medicines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching medicines.' });
  }
};

exports.deactivateMedicine = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const medicine = await Medicine.findOne({
      where: { id: req.params.id, patient_id: patient.id },
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    medicine.active = false;
    await medicine.save();

    res.json({ message: 'Medicine deactivated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deactivating medicine.' });
  }
};

exports.getTodayDoses = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const today = todayDateOnly();
    const medicines = await Medicine.findAll({
      where: { patient_id: patient.id, active: true },
    });

    for (const med of medicines) {
      for (const time of med.times_json) {
        await MedicineLog.findOrCreate({
          where: { medicine_id: med.id, scheduled_date: today, scheduled_time: time },
          defaults: { patient_id: patient.id, status: 'pending' },
        });
      }
    }

    const doses = await MedicineLog.findAll({
      where: { patient_id: patient.id, scheduled_date: today },
      include: [{ model: Medicine, attributes: ['name', 'dosage'] }],
      order: [['scheduled_time', 'ASC']],
    });

    res.json({ doses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching today\'s doses.' });
  }
};

exports.updateDoseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['taken', 'missed'].includes(status)) {
      return res.status(400).json({ message: 'status must be taken or missed.' });
    }

    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const log = await MedicineLog.findOne({
      where: { id: req.params.id, patient_id: patient.id },
    });

    if (!log) {
      return res.status(404).json({ message: 'Dose log not found.' });
    }

    log.status = status;
    log.taken_at = status === 'taken' ? new Date() : null;
    await log.save();

    res.json({ log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating dose status.' });
  }
};

exports.getAdherenceHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.user.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found for this user.' });
    }

    const logs = await MedicineLog.findAll({
      where: { patient_id: patient.id },
      include: [{ model: Medicine, attributes: ['name'] }],
      order: [['scheduled_date', 'DESC'], ['scheduled_time', 'DESC']],
      limit: 200,
    });

    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching adherence history.' });
  }
};