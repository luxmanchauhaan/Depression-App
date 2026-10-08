const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Activity = sequelize.define('Activity', {
  category: {
    type: DataTypes.ENUM('yoga', 'meditation', 'music', 'physical_activity'),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: true },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: true },
  assigned_date: { type: DataTypes.DATEONLY, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'activities',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Activity;