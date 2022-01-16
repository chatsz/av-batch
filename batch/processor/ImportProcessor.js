"use strict";
const csvjson = require("csvjson");
const logger = require("../../common/utils/logBatchUtils");
const dayjs = require("dayjs");
const TMUploadLogDao = require("../../common/dao/TMUploadLogDao");
const db = require("../../common/models").sequelize;
const fs = require("fs-extra");
const path = require("path");
const localPath = require('../../config/batch.json').localPath;
const fileUtil = require('../../common/utils/fileUtils');
const asyncUtil = require("../../common/utils/asyncUtil");
const importPath = require('../../config/batch.json').importPath;
const exportPath = require('../../config/batch.json').exportPath;
const mail = require('../../config/batch.json').mail;
const InquiryDao = require("../../common/dao/InquiryDao");

const avImportProcessor = require('./AVImportProcessor');

const scanFileProcessor = require('./ScanFileProcessor');

const nodemailer = require('nodemailer');

const excelExport = require('./ExcelExport');


class ImportProcessor {
  constructor() { }

  async process() {

    try {
      logger.info("Start Process Import File");
      logger.info("Version 1.0.1");

      logger.info("Scan File..");

      const _avImportProcessor = new avImportProcessor();

      const _scanFileProcessor = new scanFileProcessor();

      const _excelExport = new excelExport();

      let files = await _scanFileProcessor.process();

      console.log("Files: ", files);

      files = files.sort();

      console.log("Sort: ", files);

      await asyncUtil.asyncForEach(files, async (data) => {

        console.log("file->", data);

        const fName = path.basename(data);
        const pName = path.dirname(data);

        console.log("pName->", pName);
        console.log("fName->", fName);

        const importFile = data;
        const newFile = importPath.archive + fName + "_" + Date.now().toString();

        console.log("nFile->", newFile);

        await _avImportProcessor.process(importFile, newFile);

      });

      let transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.secure,
        use_authentication: mail.use_authentication,
        auth: {
          user: mail.user,
          pass: mail.password
        }
      });

      const _filePath = exportPath.path;

      let _sEmail = "";
      let _ccMail = "";
      let _country = "";
      let _sql = "";
      let _fileName = "";
      let _subject = "";
      let _to = "";
      let _body = "";



      let notifyConfig = await InquiryDao.inquiry("select * from notifyconfig");


      let _sqlR5 = "select b.documentNbr as Document,b.partaintMRN as MRN,b.partaintPhysicainName as 'Physician Name',c.abCode as 'Customer Code',c.extenedName as 'Customer Name',b.createDate as 'Create Date',d.itemCode as 'Item Code',d.description1 as 'Item Description',a.batchNumber as 'Batch Number',a.expiryDate as 'Expiry Date', a.usageQty as 'Used Qty',a.itemPrice as 'Price per Unit',a.usedDate as 'Used Date',a.rfid as RFID,a.partaintRemark1 as Remark1 ,a.partaintRemark2 as Notes,a.isTopUp as 'Top up',a.isBill as Bill,b.createUser as User,createDate as 'Entry Date'";
      _sqlR5 += " from ttr5utilizationitem a left join ttr5utilization b on a.r5UtilizationID=b.r5UtilizationID";
      _sqlR5 += " left join tmcustomer c on b.customerID=c.customerID";
      _sqlR5 += " left join tmitem d on a.itemID=d.itemID";
      _sqlR5 += " where b.status=2 and (b.notifyFlag=0 or b.notifyFlag is null) ";


      let _sqlMovement = "select b.documentNbr as Document,c.abCode as 'Own Customer Code',c.extenedName as 'Own Customer Name',d.abCode as ' To Customer Code',d.extenedName as 'To Customer Name',";
      _sqlMovement += "(case when (b.actionType=1) then 'IT Adjust' when (b.actionType=2) then 'Transfer' when (b.actionType=3) then 'Top up' when (b.actionType=4) then 'Return to DC' end) as 'Type',";
      _sqlMovement += "b.requestBy as 'Request By',b.contactNo as 'Contact No',b.contactPerson as 'Contact Person',b.contactPersonNumber as 'Contact Person Number',b.deliveryDate as 'Delivery Date',";
      _sqlMovement += " e.itemCode as 'Item Code',e.description1 as 'Item Description',a.batchNumber as 'Batch Number',a.expiryDate as 'Expiry Date', a.usageQty as 'Qty',a.requireDate as 'Require Date',a.remark,";
      _sqlMovement += "(case when (stopshipLotCheckedFlg=1) then 'Yes' when (stopshipLotCheckedFlg=0) then 'No' end) as 'Stopship Status',";
      _sqlMovement += "b.createUser as User,createDate as 'Entry Date'";

      _sqlMovement += " from ttinvmovementitem a";
      _sqlMovement += " left join ttinvmovement b on a.invMovementID=b.invMovementID";
      _sqlMovement += " left join tmcustomer c on b.fromCustomerID=c.customerID";
      _sqlMovement += " left join tmcustomer d on b.toCustomerID=d.customerID";
      _sqlMovement += " left join tmitem e on a.itemID=e.itemID";
      _sqlMovement += " where b.status=2 and (b.notifyFlag=0 or b.notifyFlag is null) ";



      _sql = _sqlR5 + " and a.isTopUp=1 order by b.documentNbr";

      let _r5UpdateList = [];

      let _dataTopUp = await InquiryDao.inquiry(_sql);
      console.log("TOP UP: ", _dataTopUp);

      if (_dataTopUp.length > 0) {

        _fileName = "TopUp_" + Date.now().toString() + ".xlsx";

        await _excelExport.export(_dataTopUp, _filePath + _fileName);

        _subject = "Request for Top up";

        _to = notifyConfig.filter(z => z.sType == "01" && z.sProgram == "R5");

        logger.info("SEND MAIL: R5 TopUp");
        logger.info("SUBJECT: ", _subject);
        logger.info("TO: ", _to[0].sEmail);

        _body = "<b>Dear All,</b><br><br>"
        _body += "<b>Please provide Top up refer to the detail in attached file.</b>"

        let info = await transporter.sendMail({
          from: mail.emailSender,
          to: _to[0].sEmail, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
          subject: _subject,
          html: _body,
          priority: "high",
          attachments: [
            {
              path: _filePath + _fileName
            }
          ]
        });
        // log ข้อมูลการส่งว่าส่งได้-ไม่ได้
        console.log('Message sent: %s', info.messageId);

        for (let index = 0; index < _dataTopUp.length; index++) {
          const element = _dataTopUp[index];

          const _r5Upd = { documentNbr: element.Document };

          _r5UpdateList.push(_r5Upd);

        }

      }

      _sql = _sqlR5 + " and a.isBill=1 order by b.documentNbr";

      let _dataBill = await InquiryDao.inquiry(_sql);
      console.log("BILL: ", _dataBill);

      if (_dataBill.length > 0) {

        _fileName = "Bill_" + Date.now().toString() + ".xlsx";

        await _excelExport.export(_dataBill, _filePath + _fileName);

        _subject = "Request for Bill";

        _to = notifyConfig.filter(z => z.sType == "02" && z.sProgram == "R5");

        logger.info("SEND MAIL: R5 BILL");
        logger.info("SUBJECT: ", _subject);
        logger.info("TO: ", _to[0].sEmail);

        _body = "<b>Dear All,</b><br><br>"
        _body += "<b>Please bill to customer refer to the detail in attached file.</b>"

        let info = await transporter.sendMail({
          from: mail.emailSender,
          to: _to[0].sEmail, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
          subject: _subject,
          html: _body,
          priority: "high",
          attachments: [
            {
              path: _filePath + _fileName
            }
          ]
        });
        // log ข้อมูลการส่งว่าส่งได้-ไม่ได้
        console.log('Message sent: %s', info.messageId);

        for (let index = 0; index < _dataBill.length; index++) {
          const element = _dataBill[index];

          const _r5Upd = { documentNbr: element.Document };

          _r5UpdateList.push(_r5Upd);

        }

      }

      logger.info("Update R5 NotifyFlag");

      for (let index = 0; index < _r5UpdateList.length; index++) {
        const element = _r5UpdateList[index];
        logger.info("Update R5 NotifyFlag : DocumentNbr : ", element.documentNbr);

        await InquiryDao.update("update ttr5utilization set notifyFlag=1 where documentNbr='" + element.documentNbr + "'");

      }


      //=== End R5 ====================================================

      //==== MoveMent =================================================
      let _action = 0;

      for (let index = 1; index < 5; index++) {

        _action = index;

        _sql = _sqlMovement
        _sql += "and b.actionType=" + _action.toString();
        _sql += " order by b.documentNbr";

        const _data = await InquiryDao.inquiry(_sql);
        console.log(_data);

        if (_data.length > 0) {

          let _actionType = "";
          let _subject = "";
          let _bodyDetail = "";
          let _sType = "";
          if (_action == 1) {
            _actionType = "ITAdjust_";
            _subject = "Request for IT Adjust";
            _bodyDetail = "<b>Please process IT Adjust refer to the detail in attached file.</b>";
            _sType = "01";
          } else {
            if (_action == 2) {
              _actionType = "Transfer_";
              _subject = "Request for transfer";
              _bodyDetail = "<b>Please process Transfer refer to the detail in attached file.</b>";
              _sType = "02";
            } else {
              if (_action == 3) {
                _actionType = "TopUp_";
                _subject = "Request for Top up";
                _bodyDetail = "<b>Please provide Top up refer to the detail in attached file.</b>";
                _sType = "03";
              } else {
                if (_action == 4) {
                  _actionType = "ReturnDC_";
                  _subject = "Request for return to DC";
                  _bodyDetail = "<b>Please process Return refer to the detail in attached file.</b>";
                  _sType = "04";
                }
              }
            }
          }

          console.log("PROCESS : ", _actionType);

          _to = notifyConfig.filter(z => z.sType == _sType && z.sProgram == "IM");

          _fileName = _actionType + Date.now().toString() + ".xlsx";

          console.log("Export Excel: ", _fileName);

          await _excelExport.export(_data, _filePath + _fileName);

          console.log("Export Complete");

          logger.info("SEND MAIL: Movement");
          logger.info("SUBJECT: ", _subject);
          logger.info("TO: ", _to[0].sEmail);

          _body = "<b>Dear All,</b><br><br>"
          _body += _bodyDetail

          let info = await transporter.sendMail({
            from: mail.emailSender,
            to: _to[0].sEmail, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            subject: _subject,
            html: _body,
            priority: "high",
            attachments: [
              {
                path: _filePath + _fileName
              }
            ]
          });
          // log ข้อมูลการส่งว่าส่งได้-ไม่ได้
          console.log('Message sent: %s', info.messageId);

          logger.info("Update Movement NotifyFlag");
          for (let index = 0; index < _data.length; index++) {
            const element = _data[index];
            await InquiryDao.update("update ttinvmovement set notifyFlag=1 where documentNbr='" + element.Document+"'");       
            
            logger.info("Update Movement NotifyFlag : DocumentNbr : ", element.Document);
          }
          
        }

      }

      //=== End Movement ====================================================


      return true;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }

}

module.exports = ImportProcessor;
