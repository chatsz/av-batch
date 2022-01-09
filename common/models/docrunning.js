'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('docrunning', {
        tableName: { type: DataTypes.STRING(45), primaryKey: true},     
        running: DataTypes.INTEGER           
    });
 
    return model;
}