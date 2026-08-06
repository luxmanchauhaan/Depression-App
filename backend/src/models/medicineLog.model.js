const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MedicineLog = sequelize.define('MedicineLog', {
  scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
  scheduled_time: { type: DataTypes.STRING(5), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'taken', 'missed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  taken_at: { type: DataTypes.DATE },
}, {
  tableName: 'medicine_logs',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = MedicineLog;