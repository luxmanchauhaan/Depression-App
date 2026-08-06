const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Medicine = sequelize.define('Medicine', {
  name: { type: DataTypes.STRING(150), allowNull: false },
  dosage: { type: DataTypes.STRING(100) },
  times_json: { type: DataTypes.JSON, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'medicines',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Medicine;