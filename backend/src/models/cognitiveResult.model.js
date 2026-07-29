const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CognitiveResult = sequelize.define('CognitiveResult', {
  test_type: {
    type: DataTypes.ENUM('memory', 'attention', 'processing_speed', 'executive_function', 'visual_memory'),
    allowNull: false,
  },
  score: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  details_json: { type: DataTypes.JSON },
  taken_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'cognitive_results',
  underscored: true,
  timestamps: false,
});

module.exports = CognitiveResult;