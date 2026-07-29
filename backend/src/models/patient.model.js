const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('Patient', {
  date_of_birth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING(30) },
}, {
  tableName: 'patients',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // patients table has no updated_at column
});

module.exports = Patient;
