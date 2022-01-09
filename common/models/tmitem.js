'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('tmitem', {
        itemID: { type: DataTypes.INTEGER, primaryKey: true},     
        itemCode: DataTypes.STRING(45),                
        agency: DataTypes.STRING(3),
        agencyName: DataTypes.STRING(255),
        catalog: DataTypes.STRING(45),
        description1: DataTypes.STRING(255),
        descriptionLine2: DataTypes.STRING(255),
        uom: DataTypes.STRING(3),
        uomDesc: DataTypes.STRING(255),
        brandCode: DataTypes.STRING(3),
        brandName: DataTypes.STRING(255),
        subBrand: DataTypes.STRING(255),
        itemCat: DataTypes.STRING(255),
        itemCatName: DataTypes.STRING(255),
        itemGroup: DataTypes.STRING(6),
        itemGroupName: DataTypes.STRING(255),
        itemPackSize: DataTypes.STRING(6),
        itemPackSizeName: DataTypes.STRING(255),
        packType: DataTypes.STRING(3),
        packTypeName: DataTypes.STRING(255),
        sku3rd: DataTypes.STRING(45),
        principalCode: DataTypes.STRING(45),
        barcode: DataTypes.STRING(45),
        segment1: DataTypes.STRING(255),
        segment2: DataTypes.STRING(255),
        segment3: DataTypes.STRING(255),
        importDate: DataTypes.DATE,
        stopShipFlg: DataTypes.BOOLEAN       
    });
 
    return model;
}