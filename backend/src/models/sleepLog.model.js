const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SleepLog = sequelize.define('SleepLog', {
  hours_slept: { type: DataTypes.DECIMAL(3, 1), allowNull: false },
  quality: {
    type: DataTypes.ENUM('poor', 'fair', 'good'),
    allowNull: false,
  },
  logged_date: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'sleep_logs',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = SleepLog;