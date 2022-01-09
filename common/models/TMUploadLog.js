'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('TMUploadLog', {
        nUploadID: { type: DataTypes.INTEGER, primaryKey: true,  autoIncrement: true},
        sDocTypeID: DataTypes.STRING(10),
        sFileName: DataTypes.STRING(255),
        sFileNameNew: DataTypes.STRING(255),
        nTotalRecord: DataTypes.INTEGER,
        nSuccessRecord: DataTypes.INTEGER,
        sStatus: DataTypes.STRING(50),
        sRemark: DataTypes.STRING,
        dUploadDate: DataTypes.DATE,
        sUploadUser: DataTypes.STRING(50),
        dProcessDate: DataTypes.DATE            
    });   

    return model;
}