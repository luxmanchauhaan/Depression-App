const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'doctor'), allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;
