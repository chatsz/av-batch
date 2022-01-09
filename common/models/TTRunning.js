'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('TTRunning', {
        nYear: { type: DataTypes.INTEGER, primaryKey: true},     
        nRunning: { type: DataTypes.STRING(6), primaryKey: true},                
        sType_running: { type: DataTypes.STRING(50), primaryKey: true},         
        sUpdateDate: DataTypes.STRING(8),
        sUpdateTime: DataTypes.STRING(8)     
    });
 
    return model;
}