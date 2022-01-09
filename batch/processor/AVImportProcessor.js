"use strict";
const csvjson = require("csvjson");
const logger = require("../../common/utils/logBatchUtils");
const dayjs = require("dayjs");
const TMItemDao = require("../../common/dao/TMItemDao");
const TMCustomerDao = require("../../common/dao/TMCustomerDao");
const TTInventoryBalanceDao = require("../../common/dao/TTInventoryBalanceDao");
const DocRunningDao = require("../../common/dao/DocRunningDao");
const db = require("../../common/models").sequelize;
const fs = require("fs-extra");
const path = require("path");
const importPath = require('../../config/batch.json').importPath;
const fileUtil = require('../../common/utils/fileUtils');
const TMUploadLogDao = require("../../common/dao/TMUploadLogDao");
const dateUtil = require('../../common/utils/dateUtils');
const dateFormat = require('dateformat');

const xlsxFile = require('read-excel-file/node');

class AVImportProcessor {
    constructor() { }

    async process(importFile, newFile) {

        try {


            logger.info("Excel File: ", importFile);

            xlsxFile(importFile).then((datas) => {

                logger.info("Total Lines :" + datas.length);

                logger.info("Validation file...");

                let _fileHeader = datas[0][0] + datas[0][1];;
                logger.info("HEADER[0+1]->", _fileHeader);

                switch (_fileHeader) {
                    case 'ItemNoCatalogNumber':
                        console.log("Item Master");
                        ProcessItemMaster(datas,  path.basename(importFile), path.basename(newFile));
                        break;
                    case 'ABCodeMailName1':
                        console.log("Customer Master");
                        ProcessCustomerMaster(datas,  path.basename(importFile), path.basename(newFile));
                        break;
                    case 'ItemNoBP':
                        console.log("Inventory Balance");
                        ProcessInventoryBalance(datas,  path.basename(importFile), path.basename(newFile));
                        break;

                }


                fs.rename(importFile, newFile, function (err) {
                    if (err) throw err
                    console.log('Successfully renamed - archive moved!')
                });

            });


        } catch (e) {
            logger.error(e);
            throw e;
        }

        return "AVProcessor: processed.";
    }    
}

async function ProcessItemMaster(datas, orgFile, newFile) {
    logger.info("Update Import Item Master..");

    let _execDate = new Date();
    let _err = "";

    try {
        let _totalSuccessRecord = 1;
        let _row = 1;
        for (_row = 1; _row < datas.length; _row++) {
            try {

                var _data = datas[_row];
                let _dataLog = "DATA ROW[" + _row.toString() + "] : " + _data[0] + "," + _data[1] + "," + _data[2] + "," + _data[3] + "," + _data[4] + "," + _data[5] + "," + _data[6] + "," + _data[7] + "," + _data[8];
                _dataLog += _data[9] + "," + _data[10] + "," + _data[11] + "," + _data[12] + "," + _data[13] + _data[14] + "," + _data[15] + "," + _data[16] + "," + _data[17] + "," + _data[18];
                _dataLog += _data[19] + "," + _data[20] + "," + _data[21] + "," + _data[22] + "," + _data[23] + "," + _data[24];

                logger.info(_dataLog);

                let _update = {};

                _update.agency = "";
                _update.agencyName = "";
                _update.itemPackSizeName = "";
                _update.packType = "";
                _update.packTypeName = "";
                _update.sku3rd = "";
                _update.principalCode = "";
                _update.barcode = "";
                _update.subBrand = "";
     

                _update.itemCode = await checkNull(_data[0]);
                _update.catalog = await checkNull(_data[1]);
                _update.description1 = await checkNull(_data[2]);
                _update.descriptionLine2 = await checkNull(_data[3]);
                _update.brandCode = await checkNull(_data[4]);
                _update.brandName = await checkNull(_data[5]);
                _update.subBrandDesc = await checkNull(_data[7]);
                _update.itemGroup = await checkNull(_data[8]);
                _update.itemGroupName = await checkNull(_data[9]);
                _update.itemCat = await checkNull(_data[12]);
                _update.itemCatName = await checkNull(_data[13]);
                _update.segment1 = await checkNull(_data[17]);
                _update.segment2 = await checkNull(_data[19]);
                _update.segment3 = await checkNull(_data[21]);
                _update.uom = await checkNull(_data[22]);
                _update.uomDesc = await checkNull(_data[22]);
               

                let _stopShipFlg = await checkNull(_data[24]);
                _stopShipFlg == "" ? _update.stopShipFLg = 0 : _update.stopShipFLg = 1;

                _update.importDate = Date.now();                

                logger.info("ROW : " + _row.toString() + " : DATA-->", _update);

                let _ckCriteria = {
                    itemCode: _update.itemCode,                       
                }

                let inq = await TMItemDao.get(_ckCriteria);

                console.log("FIND ITEM->",inq);

                if (inq == null) {
                    logger.info("ROW : " + _row.toString() + " : CREATE");
                    await createItemMaster(_update);
                } else {
                    logger.info("ROW : " + _row.toString() + " : UPDATE");
                    _update.itemID = inq.dataValues.itemID;
                    await updateItemMaster(_update);
                }

                _totalSuccessRecord += 1;

            } catch (e) {
                logger.error("ERROR ROW : " + _row.toString() + ":" + e.toString());
                _err += "ERROR ROW : " + _row.toString() + ":" + e.toString() + "<br>";
            }

        }



        let _updateLog = {           
            sDocTypeID: "ITEMMASTER",
            sFileName: orgFile,
            sFileNameNew: newFile,
            nTotalRecord: datas.length - 1,
            nSuccessRecord: _totalSuccessRecord - 1,            
            sRemark: _err,
            sStatus: (datas.length == _totalSuccessRecord) ? 'SUCCESS' : 'FAILED',
            sUploadUser: "import",
            dUploadDate: Date.now(),
            dProcessDate: Date.now()
        }

        await updateUploadLogStatus(_updateLog);

        logger.info("COMPLETE JOB : Import Item Master");

    } catch (e) {
        logger.error(e);
        //throw e;
    }



    return "FINISHED"; //End Step
}

async function ProcessCustomerMaster(datas, orgFile, newFile) {
    logger.info("Update Import Customer Master..");

    let _execDate = new Date();
    let _err = "";

    try {
        let _totalSuccessRecord = 1;
        let _row = 1;
        for (_row = 1; _row < datas.length; _row++) {
            try {

                var _data = datas[_row];
                let _dataLog = "DATA ROW[" + _row.toString() + "] : " + _data[0] + "," + _data[1] + "," + _data[2] + "," + _data[3] + "," + _data[4] + "," + _data[5] + "," + _data[6] + "," + _data[7] + "," + _data[8];
                _dataLog += _data[9] + "," + _data[10] + "," + _data[11] + "," + _data[12] + "," + _data[13] + _data[14] + "," + _data[15] + "," + _data[16];

                logger.info(_dataLog);

                let _update = {};
                _update.abCode = await checkNull(_data[0]);
                _update.mailName1 = await checkNull(_data[1]);
                _update.mailName2 = await checkNull(_data[2]);
                _update.extenedName = await checkNull(_data[3]);
                _update.address1 = await checkNull(_data[4]);
                _update.address2 = await checkNull(_data[5]);
                _update.address3 = await checkNull(_data[6]);
                _update.city = await checkNull(_data[7]);
                _update.province = await checkNull(_data[8]);
                _update.postCode = await checkNull(_data[9]);
                _update.country = await checkNull(_data[10]);
                _update.paymentTerm = await checkNull(_data[11]);
                _update.paymentTermDesc = await checkNull(_data[12]);
                _update.currency = await checkNull(_data[13]);
                _update.taxCode = await checkNull(_data[14]);
                _update.taxRate = await checkNull(_data[15]);
                _update.searchType = await checkNull(_data[16]);
               
                _update.importDate = Date.now();

                logger.info("ROW : " + _row.toString() + " : DATA-->", _update);

                let _ckCriteria = {
                    abCode: _update.abCode,                       
                }

                let inq = await TMCustomerDao.get(_ckCriteria);

                console.log("FIND CUSTOMER->",inq);

                if (inq == null) {
                    logger.info("ROW : " + _row.toString() + " : CREATE");
                    await createCustomerMaster(_update);
                } else {
                    logger.info("ROW : " + _row.toString() + " : UPDATE");
                    _update.customerID = inq.dataValues.customerID;
                    await updateCustomerMaster(_update);
                }

                _totalSuccessRecord += 1;

            } catch (e) {
                logger.error("ERROR ROW : " + _row.toString() + ":" + e.toString());
                _err += "ERROR ROW : " + _row.toString() + ":" + e.toString() + "<br>";
            }

        }

        let _updateLog = {           
            sDocTypeID: "CUSTMASTER",
            sFileName: orgFile,
            sFileNameNew: newFile,
            nTotalRecord: datas.length - 1,
            nSuccessRecord: _totalSuccessRecord - 1,            
            sRemark: _err,
            sStatus: (datas.length == _totalSuccessRecord) ? 'SUCCESS' : 'FAILED',
            sUploadUser: "import",
            dUploadDate: Date.now(),
            dProcessDate: Date.now()
        }

        await updateUploadLogStatus(_updateLog);

        logger.info("COMPLETE JOB : Import Customer Master");

    } catch (e) {
        logger.error(e);
        //throw e;
    }



    return "FINISHED"; //End Step
}

async function ProcessInventoryBalance(datas, orgFile, newFile) {
    logger.info("Update Import Inventory Balance..");

    let _execDate = new Date();
    let _err = "";

    try {
        let _totalSuccessRecord = 1;
        let _row = 1;
        for (_row = 1; _row < datas.length; _row++) {
            try {

                var _data = datas[_row];
                let _dataLog = "DATA ROW[" + _row.toString() + "] : " + _data[0] + "," + _data[1] + "," + _data[2] + "," + _data[3] + "," + _data[4] + "," + _data[5] + "," + _data[6] + "," + _data[7];
             
                logger.info(_dataLog);

                let _update = {};
                _update.customerID = 0;
                _update.itemID = 0;
                _update.batchNumber = await checkNull(_data[4]);
                _update.expiryDate = await checkNull(_data[5]);
                _update.rfid = await checkNull(_data[1]);
                _update.uom = await checkNull(_data[7]);
                _update.openQty = await checkNull(_data[6]);
                _update.usageQty = 0;
                _update.availableQty = await checkNull(_data[6]);
                _update.itemNo = await checkNull(_data[0]);
                _update.abCode = await checkNull(_data[3]);
                              
                _update.importDate = Date.now();

                logger.info("ROW : " + _row.toString() + " : CREATE");
                    await createInventoryBalance(_update);                

                _totalSuccessRecord += 1;

            } catch (e) {
                logger.error("ERROR ROW : " + _row.toString() + ":" + e.toString());
                _err += "ERROR ROW : " + _row.toString() + ":" + e.toString() + "<br>";
            }

        }

        let _updateLog = {           
            sDocTypeID: "INVBALANCE",
            sFileName: orgFile,
            sFileNameNew: newFile,
            nTotalRecord: datas.length - 1,
            nSuccessRecord: _totalSuccessRecord - 1,            
            sRemark: _err,
            sStatus: (datas.length == _totalSuccessRecord) ? 'SUCCESS' : 'FAILED',
            sUploadUser: "import",
            dUploadDate: Date.now(),
            dProcessDate: Date.now()
        }

        await updateUploadLogStatus(_updateLog);

        logger.info("COMPLETE JOB : Import Inventory Balance");

    } catch (e) {
        logger.error(e);
        //throw e;
    }



    return "FINISHED"; //End Step
}

async function createItemMaster(req) {
    let transaction = await db.transaction();

    try {
       
        let result = await TMItemDao.create(transaction, req);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        throw e;
    }
}

async function updateItemMaster(req) {
   
    let transaction = await db.transaction();

    try {

        //update
        let result = await TMItemDao.update(transaction, req);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        throw e;
    }
}

async function createCustomerMaster(req) {
    let transaction = await db.transaction();

    try {
       
        let result = await TMCustomerDao.create(transaction, req);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        throw e;
    }
}

async function updateCustomerMaster(req) {
   
    let transaction = await db.transaction();

    try {

        //update
        let result = await TMCustomerDao.update(transaction, req);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        throw e;
    }
}

async function checkNull(data) {
    var _ret = data == null ? "" : data;
    _ret = _ret.toString().trim();

    return _ret;
}

async function createInventoryBalance(req) {
    let transaction = await db.transaction();

    try {
       
        let result = await TTInventoryBalanceDao.create(transaction, req);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        throw e;
    }
}

async function updateUploadLogStatus(data) {
    logger.info("Create UploadLog.....", data);

    let transaction = await db.transaction();

    try {

        if (data.sRemark != "") {
            data.sStatus = "FAILED";
        }

        //create Log
        let result = await TMUploadLogDao.create(transaction, data);

        transaction.commit();

        return result;
    } catch (e) {
        transaction.rollback();
        logger.error(e);
        throw e;
    }
}

module.exports = AVImportProcessor;
