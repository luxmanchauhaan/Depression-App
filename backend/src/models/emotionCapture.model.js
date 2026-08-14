const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmotionCapture = sequelize.define('EmotionCapture', {
  dominant_emotion: { type: DataTypes.STRING(30), allowNull: false },
  confidence: { type: DataTypes.DECIMAL(4, 3) },
  emotion_scores_json: { type: DataTypes.JSON },
  captured_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'emotion_captures',
  underscored: true,
  timestamps: false,
});

module.exports = EmotionCapture;