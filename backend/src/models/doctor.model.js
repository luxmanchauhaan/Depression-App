const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Doctor = sequelize.define('Doctor', {
  doctor_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  specialization: { type: DataTypes.STRING(150) },
}, {
  tableName: 'doctors',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // doctors table has no updated_at column
});

module.exports = Doctor;
