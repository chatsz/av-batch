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


      let _sqlR5 = "select b.documentNbr,b.partaintMRN,b.partaintPhysicainName,c.abCode,c.extenedName,b.createDate,d.itemCode,d.description1,a.batchNumber,a.usageQty,a.itemPrice,a.usedDate,a.rfid,a.partaintRemark1 ,a.partaintRemark2,a.isTopUp,a.isBill";
      _sqlR5 += " from ttr5utilizationitem a left join ttr5utilization b on a.r5UtilizationID=b.r5UtilizationID";
      _sqlR5 += " left join tmcustomer c on b.customerID=c.customerID";
      _sqlR5 += " left join tmitem d on a.itemID=d.itemID";
      _sqlR5 += " where b.r5UtilizationID=";

      let _sqlMovement = "select c.abCode as from_abCode,c.extenedName as fromCustomer,d.abCode as to_abCode,d.extenedName as toCustomer,b.actionType,b.requestBy,b.documentNbr,b.contactNo,b.contactPerson,b.contactPersonNumber,b.deliveryDate,";
      _sqlMovement += " e.itemCode,e.description1,a.batchNumber,a.usageQty,a.requireDate,a.remark,a.uuid";
      _sqlMovement += " from ttinvmovementitem a";
      _sqlMovement += " left join ttinvmovement b on a.invMovementID=b.invMovementID";
      _sqlMovement += " left join tmcustomer c on b.fromCustomerID=c.customerID";
      _sqlMovement += " left join tmcustomer d on b.toCustomerID=d.customerID";
      _sqlMovement += " left join tmitem e on a.itemID=e.itemID";
      _sqlMovement += " where b.invMovementID=";


      //==== R5 ===========================================
      let _sql = "select r5UtilizationID as ID,documentNbr as DOC,createUser from ttr5utilization where notifyFlag=0 or notifyFlag is null order by r5UtilizationID";

      const notifyConfig = await InquiryDao.inquiry("select * from notifyconfig");

      let _trans = await InquiryDao.inquiry(_sql);

      for (let index = 0; index < _trans.length; index++) {

        const element = _trans[index];

        const user = await InquiryDao.inquiry("select country,email from tmuser where userID='" + element.createUser + "'");

        _ccMail = user[0].email;
        _country = user[0].country;

        _sql = _sqlR5 + element.ID;

        const _data = await InquiryDao.inquiry(_sql);
        console.log("ID: ", element.ID);
        console.log(_data);

        let _dataTopUp = _data.filter(z => z.isTopUp == 1);

        if (_dataTopUp.length > 0) {

          const _fileName = element.DOC + "_TopUp_" + Date.now().toString() + ".xlsx";

          await _excelExport.export(_dataTopUp, _filePath + _fileName);

          const _subject = element.DOC + " : Request for Top up";

          const _to = notifyConfig.filter(z => z.sCountry == _country && z.sType == "01" && z.sProgram == "R5");

          logger.info("SEND MAIL: R5 TopUp");
          logger.info("SUBJECT: ", _subject);
          logger.info("TO: ",_to[0].sEmail);
          logger.info("CC: ",_ccMail);


          let _body = "<b>Dear All,</b><br><br>"
          _body += "<b>Please provide Top up refer to the detail in attached file.</b>"

          let info = await transporter.sendMail({
            from: mail.emailSender,
            to: _to[0].sEmail, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            cc: _ccMail,
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
        }

        let _dataBill = _data.filter(z => z.isBill == 1);

        if (_dataBill.length > 0) {

          const _fileName = element.DOC + "_Bill_" + Date.now().toString() + ".xlsx";

          await _excelExport.export(_dataTopUp, _filePath + _fileName);

          const _subject = element.DOC + " : Request for Bill";

          const _to = notifyConfig.filter(z => z.sCountry == _country && z.sType == "02" && z.sProgram == "R5");

          logger.info("SEND MAIL: R5 BILL");
          logger.info("SUBJECT: ", _subject);
          logger.info("TO: ",_to[0].sEmail);
          logger.info("CC: ",_ccMail);

          let _body = "<b>Dear All,</b><br><br>"
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
        }

        await InquiryDao.update("update ttr5utilization set notifyFlag=1 where r5UtilizationID=" + element.ID)

      }

      //=== End R5 ====================================================

      //==== MoveMent =================================================
      _sql = "select invMovementID as ID,documentNbr as DOC,actionType, createUser from ttinvmovement where notifyFlag=0 or notifyFlag is null  order by invMovementID";

      _trans = await InquiryDao.inquiry(_sql);

      for (let index = 0; index < _trans.length; index++) {
        const element = _trans[index];
        _sql = _sqlMovement + element.ID;

        const _data = await InquiryDao.inquiry(_sql);
        console.log("ID: ", element.ID);
        console.log(_data);

        if (_data.length > 0) {

          console.log("PROCESS : ", element.actionType);

          const user = await InquiryDao.inquiry("select country,email from tmuser where userID='" + element.createUser + "'");

          _ccMail = user[0].email;
          _country = user[0].country;

          let _actionType = "";
          let _subject = "";
          let _bodyDetail = "";
          let _sType = "";
          if (element.actionType == 1) {
            _actionType = element.DOC + "_ITAdjust_";
            _subject = element.DOC + " : Request for IT Adjust";
            _bodyDetail = "<b>Please process IT Adjust refer to the detail in attached file.</b>";
            _sType = "01";
          } else {
            if (element.actionType == 2) {
              _actionType = element.DOC + "_Transfer_";
              _subject = element.DOC + " : Request for transfer";
              _bodyDetail = "<b>Please process Transfer refer to the detail in attached file.</b>";
              _sType = "02";
            } else {
              if (element.actionType == 3) {
                _actionType = element.DOC + "_TopUp_";
                _subject = element.DOC + " : Request for Top up";
                _bodyDetail = "<b>Please provide Top up refer to the detail in attached file.</b>";
                _sType = "03";
              } else {
                if (element.actionType == 4) {
                  _actionType = element.DOC + "_ReturnDC_";
                  _subject = element.DOC + " : Request for return to DC";
                  _bodyDetail = "<b>Please process Return refer to the detail in attached file.</b>";
                  _sType = "04";
                }
              }
            }
          }

          const _to = notifyConfig.filter(z => z.sCountry == _country && z.sType == _sType && z.sProgram == "IM");

          const _fileName = _actionType + Date.now().toString() + ".xlsx";

          console.log("Export Excel: ", _fileName);

          await _excelExport.export(_data, _filePath + _fileName);

          console.log("Export Complete");

          logger.info("SEND MAIL: Movement");
          logger.info("SUBJECT: ", _subject);
          logger.info("TO: ",_to[0].sEmail);
          logger.info("CC: ",_ccMail);

          let _body = "<b>Dear All,</b><br><br>"
          _body += _bodyDetail

          let info = await transporter.sendMail({
            from: mail.emailSender,
            to: _to[0].sEmail, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            cc: _ccMail,
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
        }


        await InquiryDao.update("update ttinvmovement set notifyFlag=1 where invMovementID=" + element.ID)

      }

      //=== End R5 ====================================================


      return true;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }

}

module.exports = ImportProcessor;
