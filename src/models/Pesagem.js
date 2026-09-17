const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Turma = require('./Turma');

const Pesagem = sequelize.define('Pesagem', {
  codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  peso: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  codigo_turma: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Turma,
      key: 'codigo'
    }
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pesagem',
  timestamps: false,
  freezeTableName: true
});

Turma.hasMany(Pesagem, { foreignKey: 'codigo_turma', as: 'pesagens' });
Pesagem.belongsTo(Turma, { foreignKey: 'codigo_turma', as: 'turma' });

module.exports = Pesagem;
