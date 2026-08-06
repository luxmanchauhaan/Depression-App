const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WeightLog = sequelize.define('WeightLog', {
  weight_kg: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  logged_date: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'weight_logs',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = WeightLog;