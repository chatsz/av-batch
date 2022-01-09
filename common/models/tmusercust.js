'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('tmusercust', {
        userCustID: { type: DataTypes.INTEGER, primaryKey: true},     
        userID: DataTypes.STRING(45),                
        customerID: DataTypes.INTEGER,      
    });
 
    return model;
}