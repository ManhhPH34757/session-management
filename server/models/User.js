const { DataTypes } = require('sequelize');
const sequelize = require('../database');

/* Tương đương DDL auto update*/
const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullname: DataTypes.STRING,
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  role: DataTypes.STRING,
  refresh_token: DataTypes.TEXT,
  avatar: DataTypes.STRING
});

module.exports = User;
