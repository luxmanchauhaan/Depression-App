const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BdiResponse = sequelize.define('BdiResponse', {
  answers_json: { type: DataTypes.JSON, allowNull: false },
  total_score: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
  severity: {
    type: DataTypes.ENUM('minimal', 'mild', 'moderate', 'severe'),
    allowNull: false,
  },
  recommendations_json: { type: DataTypes.JSON, defaultValue: null },
  taken_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'bdi_responses',
  underscored: true,
  timestamps: false,
});

module.exports = BdiResponse;