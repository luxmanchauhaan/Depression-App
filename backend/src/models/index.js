const sequelize = require('../config/db');
const User = require('./user.model');
const Doctor = require('./doctor.model');
const Patient = require('./patient.model');
const BdiResponse = require('./bdiResponse.model');
const MoodLog = require('./moodLog.model');
const CognitiveResult = require('./cognitiveResult.model');

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

module.exports = {
  sequelize,
  User,
  Doctor,
  Patient,
  BdiResponse,
  MoodLog,
  CognitiveResult,
};