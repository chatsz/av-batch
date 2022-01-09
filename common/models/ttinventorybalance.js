'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('ttinventorybalance', {
        inventoryBalanceID: { type: DataTypes.INTEGER, primaryKey: true},     
        customerID: DataTypes.INTEGER,      
        itemID: DataTypes.INTEGER,                
        batchNumber: DataTypes.STRING(45),
        expiryDate: DataTypes.DATE,
        rfid: DataTypes.STRING(255),
        uom: DataTypes.STRING(3),
        openQty: DataTypes.NUMBER,
        usageQty: DataTypes.NUMBER,
        availableQty: DataTypes.NUMBER,
        itemNo: DataTypes.STRING(45),
        abCode: DataTypes.STRING(45),      
        importDate: DataTypes.DATE
    });
 
    return model;
}