const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Turma = sequelize.define('Turma', {
  codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  }
}, {
  tableName: 'turma',
  timestamps: false,
  freezeTableName: true
});

module.exports = Turma;
