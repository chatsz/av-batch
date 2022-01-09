'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('tmcustomer', {
        customerID: { type: DataTypes.INTEGER, primaryKey: true},     
        abCode: DataTypes.STRING(45),      
        mailName1: DataTypes.STRING(255),                
        mailName2: DataTypes.STRING(255),
        extenedName: DataTypes.STRING(255),
        address1: DataTypes.STRING(255),
        address2: DataTypes.STRING(255),
        address3: DataTypes.STRING(255),
        city: DataTypes.STRING(255),
        province: DataTypes.STRING(255),
        postCode: DataTypes.STRING(45),
        country: DataTypes.STRING(255),
        paymentTerm: DataTypes.STRING(5),
        paymentTermDesc: DataTypes.STRING(255),
        currency: DataTypes.STRING(255),
        taxCode: DataTypes.STRING(5),
        taxRate: DataTypes.STRING(5),
        searchType: DataTypes.STRING(5),
        importDate: DataTypes.DATE
    });
 
    return model;
}