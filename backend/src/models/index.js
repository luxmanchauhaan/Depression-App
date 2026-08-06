const sequelize = require('../config/db');
const User = require('./user.model');
const Doctor = require('./doctor.model');
const Patient = require('./patient.model');
const BdiResponse = require('./bdiResponse.model');
const MoodLog = require('./moodLog.model');
const CognitiveResult = require('./cognitiveResult.model');
const SleepLog = require('./sleepLog.model');
const WeightLog = require('./weightLog.model');
const Medicine = require('./medicine.model');
const MedicineLog = require('./medicineLog.model');

// User <-> Doctor (1:1)
User.hasOne(Doctor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Patient (1:1)
User.hasOne(Patient, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

// Doctor <-> Patient (1:many)
Doctor.hasMany(Patient, { foreignKey: 'doctor_id' });
Patient.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Patient <-> BdiResponse (1:many)
Patient.hasMany(BdiResponse, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
BdiResponse.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient <-> MoodLog (1:many)
Patient.hasMany(MoodLog, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
MoodLog.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient <-> CognitiveResult (1:many)
Patient.hasMany(CognitiveResult, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
CognitiveResult.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient <-> SleepLog (1:many)
Patient.hasMany(SleepLog, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
SleepLog.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient <-> WeightLog (1:many)
Patient.hasMany(WeightLog, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
WeightLog.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient <-> Medicine (1:many)
Patient.hasMany(Medicine, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
Medicine.belongsTo(Patient, { foreignKey: 'patient_id' });

// Medicine <-> MedicineLog (1:many)
Medicine.hasMany(MedicineLog, { foreignKey: 'medicine_id', onDelete: 'CASCADE' });
MedicineLog.belongsTo(Medicine, { foreignKey: 'medicine_id' });

// Patient <-> MedicineLog (1:many)
Patient.hasMany(MedicineLog, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
MedicineLog.belongsTo(Patient, { foreignKey: 'patient_id' });

module.exports = {
  sequelize,
  User,
  Doctor,
  Patient,
  BdiResponse,
  MoodLog,
  CognitiveResult,
  SleepLog,
  WeightLog,
  Medicine,
  MedicineLog,
};