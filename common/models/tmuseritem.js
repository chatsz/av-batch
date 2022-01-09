'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('tmuseritem', {
        userItemID: { type: DataTypes.INTEGER, primaryKey: true},     
        userID: DataTypes.STRING(45),                
        itemID: DataTypes.INTEGER,      
    });
 
    return model;
}