const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MoodLog = sequelize.define('MoodLog', {
  mood_score: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  notes: { type: DataTypes.TEXT },
  logged_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'mood_logs',
  underscored: true,
  timestamps: false,
});

module.exports = MoodLog;
