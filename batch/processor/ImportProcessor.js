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
      logger.info("Start AV Process Import File");
      logger.info("Version 1.0.6");

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
      let _senderMail = "";
      let _senderName = "";



      let notifyConfig = await InquiryDao.inquiry("select * from notifyconfig");

      let _sqlSenderMail = "select email,name,lastName from tmuser where userID = ";


      let _createUsers = await InquiryDao.inquiry("select distinct createUser as createUser,customerID as custId from ttr5utilization where status=2 and (notifyFlag=0 or notifyFlag is null)");

      console.log("R5 Create User: ", _createUsers);

      let _createUser = "";
      let _sqlR5 = "";
      let _sqlR5Mail = "";
      let _sqlMovement = "";
      let _sqlMovement2 = "";
      let _sqlMovementMail = "";
      let _ccMails = [];

      _sqlR5 = "select b.documentNbr as Document,b.partaintMRN as MRN,b.partaintPhysicainName as 'Physician Name',c.abCode as 'Customer Code',c.mailName1 as 'Customer Name',DATE_FORMAT(b.createDate, '%d %b %Y %H:%i:%s') as 'Create Date',d.itemCode as 'Item Code',d.description1 as 'Item Description',a.batchNumber as 'Batch Number',DATE_FORMAT(addtime(a.expiryDate,'3:00'), '%d %b %Y') as 'Expiry Date', a.usageQty as 'Used Qty',a.itemPrice as 'Price per Unit',DATE_FORMAT(addtime(a.usedDate,'3:00'), '%d %b %Y') as 'Used Date',a.rfid as RFID,a.partaintRemark1 as Remark1 ,a.partaintRemark2 as Notes,a.isTopUp as 'Top up',a.isBill as Bill,b.createUser as User,DATE_FORMAT(b.createDate, '%d %b %Y %H:%i:%s') as 'Entry Date',DATE_FORMAT(b.updateDate, '%d %b %Y %H:%i:%s') as 'Submit Date' ";
      _sqlR5 += " from ttr5utilizationitem a left join ttr5utilization b on a.r5UtilizationID=b.r5UtilizationID";
      _sqlR5 += " left join tmcustomer c on b.customerID=c.customerID";
      _sqlR5 += " left join tmitem d on a.itemID=d.itemID";
      _sqlR5 += " where b.status=2 and (b.notifyFlag=0 or b.notifyFlag is null) ";


      _sqlMovement = "select b.documentNbr as Document,c.abCode as 'Own Customer Code',c.mailName1 as 'Own Customer Name',d.abCode as ' To Customer Code',d.mailName1 as 'To Customer Name',";
      _sqlMovement += "(case when (b.actionType=1) then 'IT Adjust' when (b.actionType=2) then 'Transfer' when (b.actionType=3) then 'Top up' when (b.actionType=4) then 'Return to DC' end) as 'Type',";
      _sqlMovement += "b.requestBy as 'Request By',b.contactNo as 'Contact No',b.contactPerson as 'Contact Person',b.contactPersonNumber as 'Contact Person Number',DATE_FORMAT(b.deliveryDate, '%d %b %Y %H:%i:%s') as 'Delivery Date',";
      _sqlMovement += " e.itemCode as 'Item Code',e.description1 as 'Item Description',a.batchNumber as 'Batch Number',DATE_FORMAT(addtime(a.expiryDate,'3:00'), '%d %b %Y') as 'Expiry Date', a.usageQty as 'Qty',DATE_FORMAT(addtime(a.requireDate,'3:00'), '%d %b %Y') as 'Require Date',a.remark,";
      _sqlMovement += "(case when (stopshipLotCheckedFlg=1) then 'Yes' when (stopshipLotCheckedFlg=0) then 'No' end) as 'Stopship Status',";
      _sqlMovement += "b.createUser as User,DATE_FORMAT(b.createDate, '%d %b %Y %H:%i:%s') as 'Entry Date',DATE_FORMAT(b.updateDate, '%d %b %Y %H:%i:%s') as 'Submit Date'";

      _sqlMovement += " from ttinvmovementitem a";
      _sqlMovement += " left join ttinvmovement b on a.invMovementID=b.invMovementID";
      _sqlMovement += " left join tmcustomer c on b.fromCustomerID=c.customerID";
      _sqlMovement += " left join tmcustomer d on b.toCustomerID=d.customerID";
      _sqlMovement += " left join tmitem e on a.itemID=e.itemID";
      _sqlMovement += " where b.status=2 and (b.notifyFlag is null or b.notifyFlag=0) ";

      _sqlMovement2 = "select b.documentNbr as Document,c.abCode as 'Own Customer Code',c.mailName1 as 'Own Customer Name',";
      _sqlMovement2 += "(case when (b.actionType=1) then 'IT Adjust' when (b.actionType=2) then 'Transfer' when (b.actionType=3) then 'Top up' when (b.actionType=4) then 'Return to DC' end) as 'Type',";
      _sqlMovement2 += "b.requestBy as 'Request By',b.contactNo as 'Contact No',";
      _sqlMovement2 += " e.itemCode as 'Item Code',e.description1 as 'Item Description',a.batchNumber as 'Batch Number',DATE_FORMAT(addtime(a.expiryDate,'3:00'), '%d %b %Y') as 'Expiry Date', a.usageQty as 'Qty',DATE_FORMAT(addtime(a.requireDate,'3:00'), '%d %b %Y') as 'Require Date',a.remark,";
      _sqlMovement2 += "(case when (stopshipLotCheckedFlg=1) then 'Yes' when (stopshipLotCheckedFlg=0) then 'No' end) as 'Stopship Status',";
      _sqlMovement2 += "b.createUser as User,DATE_FORMAT(b.createDate, '%d %b %Y %H:%i:%s') as 'Entry Date',DATE_FORMAT(b.updateDate, '%d %b %Y %H:%i:%s') as 'Submit Date'";

      _sqlMovement2 += " from ttinvmovementitem a";
      _sqlMovement2 += " left join ttinvmovement b on a.invMovementID=b.invMovementID";
      _sqlMovement2 += " left join tmcustomer c on b.fromCustomerID=c.customerID";
      _sqlMovement2 += " left join tmcustomer d on b.toCustomerID=d.customerID";
      _sqlMovement2 += " left join tmitem e on a.itemID=e.itemID";
      _sqlMovement2 += " where b.status=2 and (b.notifyFlag is null or b.notifyFlag=0) ";


      _sqlMovementMail = "(select distinct b.createUser from ttinvmovementitem a";
      _sqlMovementMail += " left join ttinvmovement b on a.invMovementID=b.invMovementID";
      _sqlMovementMail += " left join tmcustomer c on b.fromCustomerID=c.customerID";
      _sqlMovementMail += " left join tmcustomer d on b.toCustomerID=d.customerID";
      _sqlMovementMail += " left join tmitem e on a.itemID=e.itemID";
      _sqlMovementMail += " where b.status=2 and (b.notifyFlag is null or b.notifyFlag=0) ";

      for (let userindex = 0; userindex < _createUsers.length; userindex++) {
        const userElement = _createUsers[userindex];

        console.log("CREATE USER : ", userElement.createUser);
        console.log("CUSTOMER ID : ", userElement.custId);


        _createUser = " and b.createUser='" + userElement.createUser + "' and b.customerID=" + userElement.custId;

        _sqlR5Mail = _sqlSenderMail + "'" + userElement.createUser + "'";

        _ccMails = await InquiryDao.inquiry(_sqlR5Mail);

        _sql = _sqlR5 + _createUser + " and a.isTopUp=1 order by b.documentNbr";

        let _r5UpdateList = [];

        let _cust = await InquiryDao.inquiry("select mailName1 as custName from tmcustomer where customerID=" + userElement.custId);
        let _custName = "";
        if (_cust.length > 0) {
          _custName = _cust[0].custName;
        }

        console.log("CUSTOMER NAME : ", _custName);

        // let _dataTopUp = await InquiryDao.inquiry(_sql);
        // console.log("TOP UP: ", _dataTopUp);

        // if (_dataTopUp.length > 0) {


        //   _senderMail = await GetSenderMail(_ccMails);
        //   _senderName = await GetSenderName(_ccMails);

        //   _fileName = "R5_TopUp_" + Date.now().toString() + ".xlsx";

        //   await _excelExport.export(_dataTopUp, _filePath + _fileName);

        //   _subject = "R5 Request for Top up : " + _senderName + " : " + _custName;

        //   _to = notifyConfig.filter(z => z.sType == "01" && z.sProgram == "R5");

        //   logger.info("SEND MAIL: R5 TopUp");
        //   logger.info("SUBJECT: ", _subject);
        //   logger.info("TO: ", _to[0].sEmail);
        //   logger.info("CC: ", _senderMail);

        //   _body = "<b>Dear All,</b><br><br>"
        //   _body += "<b>Please provide Top up refer to the detail in attached file.</b>"

        //   let info = await transporter.sendMail({
        //     from: mail.emailSender,
        //     to: _to[0].sEmail, // ????????????????????????????????? ??????????????????????????????????????????????????????????????? 1 ??????????????? ????????????????????????????????? ,(Comma)
        //     cc: _senderMail,
        //     subject: _subject,
        //     html: _body,
        //     priority: "high",
        //     attachments: [
        //       {
        //         path: _filePath + _fileName
        //       }
        //     ]
        //   });
        //   // log ???????????????????????????????????????????????????????????????-??????????????????
        //   console.log('Message sent: %s', info.messageId);
        // }

        // _sql = _sqlR5 + _createUser + " and a.isBill=1 order by b.documentNbr";

        // let _dataBill = await InquiryDao.inquiry(_sql);
        // console.log("BILL: ", _dataBill);

        // if (_dataBill.length > 0) {

        //   _senderMail = await GetSenderMail(_ccMails);
        //   _senderName = await GetSenderName(_ccMails);

        //   _fileName = "R5_Bill_" + Date.now().toString() + ".xlsx";

        //   await _excelExport.export(_dataBill, _filePath + _fileName);

        //   _subject = "R5 Request for Bill : " + _senderName + " : " + _custName;;

        //   _to = notifyConfig.filter(z => z.sType == "02" && z.sProgram == "R5");

        //   logger.info("SEND MAIL: R5 BILL");
        //   logger.info("SUBJECT: ", _subject);
        //   logger.info("TO: ", _to[0].sEmail);
        //   logger.info("CC: ", _senderMail);

        //   _body = "<b>Dear All,</b><br><br>"
        //   _body += "<b>Please bill to customer refer to the detail in attached file.</b>"

        //   let info = await transporter.sendMail({
        //     from: mail.emailSender,
        //     to: _to[0].sEmail, // ????????????????????????????????? ??????????????????????????????????????????????????????????????? 1 ??????????????? ????????????????????????????????? ,(Comma)
        //     cc: _senderMail,
        //     subject: _subject,
        //     html: _body,
        //     priority: "high",
        //     attachments: [
        //       {
        //         path: _filePath + _fileName
        //       }
        //     ]
        //   });
        //   // log ???????????????????????????????????????????????????????????????-??????????????????
        //   console.log('Message sent: %s', info.messageId);

        // }

        _sql = _sqlR5 + _createUser + " order by b.documentNbr";

        let _dataR5All = await InquiryDao.inquiry(_sql);
        console.log("R5_ALL : ", _dataR5All);

        if (_dataR5All.length > 0) {

          _senderMail = await GetSenderMail(_ccMails);
          _senderName = await GetSenderName(_ccMails);

          _fileName = "R5_ALL_" + Date.now().toString() + ".xlsx";

          await _excelExport.export(_dataR5All, _filePath + _fileName);

          _subject = "R5 All : " + _senderName + " : " + _custName;;

          _to = notifyConfig.filter(z => z.sType == "03" && z.sProgram == "R5");

          logger.info("SEND MAIL: R5 All");
          logger.info("SUBJECT: ", _subject);
          logger.info("TO: ", _to[0].sEmail);
          logger.info("CC: ", _senderMail);

          _body = "<b>Dear All,</b><br><br>"
          _body += "<b>Please see all R5 detail in attached file.</b>"

          let info = await transporter.sendMail({
            from: mail.emailSender,
            to: _to[0].sEmail, // ????????????????????????????????? ??????????????????????????????????????????????????????????????? 1 ??????????????? ????????????????????????????????? ,(Comma)
            cc: _senderMail,
            subject: _subject,
            html: _body,
            priority: "high",
            attachments: [
              {
                path: _filePath + _fileName
              }
            ]
          });

          console.log('Message sent: %s', info.messageId);

          for (let index = 0; index < _dataR5All.length; index++) {
            const element = _dataR5All[index];

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

      }


      //==== MoveMent =================================================

      _createUsers = await InquiryDao.inquiry("select distinct createUser as createUser,fromCustomerID as custId from ttinvmovement where status=2 and (notifyFlag=0 or notifyFlag is null)");

      console.log("Movement Create User: ", _createUsers);

      for (let userindex = 0; userindex < _createUsers.length; userindex++) {
        const userElement = _createUsers[userindex];

        console.log("CREATE USER : ", userElement.createUser);
        console.log("CUSTOMER ID : ", userElement.custId);

        _createUser = " and b.createUser='" + userElement.createUser + "' and b.fromCustomerID=" + userElement.custId;

        _sqlMovementMail = _sqlSenderMail + "'" + userElement.createUser + "'";

        _ccMails = await InquiryDao.inquiry(_sqlMovementMail);

        let _cust = await InquiryDao.inquiry("select mailName1 as custName from tmcustomer where customerID=" + userElement.custId);
        let _custName = "";
        if (_cust.length > 0) {
          _custName = _cust[0].custName;
        }
        console.log("CUSTOMER NAME : ", _custName);

        let _action = 0;

        for (let index = 1; index < 5; index++) {

          _action = index;

          if (_action == 3 || _action == 4) {
            _sql = _sqlMovement2
          } else {
            _sql = _sqlMovement
          }

          _sql += _createUser;
          _sql += " and b.actionType=" + _action.toString();
          _sql += " order by b.documentNbr";

          const _data = await InquiryDao.inquiry(_sql);
          console.log(_data);

          if (_data.length > 0) {

            _senderMail = await GetSenderMail(_ccMails);
            _senderName = await GetSenderName(_ccMails);

            let _actionType = "";
            let _subject = "";
            let _bodyDetail = "";
            let _sType = "";
            if (_action == 1) {
              _actionType = "ITAdjust_";
              _subject = "Request for IT Adjust : " + _senderName + " : " + _custName;
              _bodyDetail = "<b>Please process IT Adjust refer to the detail in attached file.</b>";
              _sType = "01";
            } else {
              if (_action == 2) {
                _actionType = "Transfer_";
                _subject = "Request for transfer : " + _senderName + " : " + _custName;
                _bodyDetail = "<b>Please process Transfer refer to the detail in attached file.</b>";
                _sType = "02";
              } else {
                if (_action == 3) {
                  _actionType = "TopUp_";
                  _subject = "Request for Top up : " + _senderName + " : " + _custName;
                  _bodyDetail = "<b>Please provide Top up refer to the detail in attached file.</b>";
                  _sType = "03";
                } else {
                  if (_action == 4) {
                    _actionType = "ReturnDC_";
                    _subject = "Request for return to DC : " + _senderName + " : " + _custName;
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
            logger.info("CC: ", _senderMail);

            _body = "<b>Dear All,</b><br><br>"
            _body += _bodyDetail

            let info = await transporter.sendMail({
              from: mail.emailSender,
              to: _to[0].sEmail, // ????????????????????????????????? ??????????????????????????????????????????????????????????????? 1 ??????????????? ????????????????????????????????? ,(Comma)
              //cc: _senderMail,
              subject: _subject,
              html: _body,
              priority: "high",
              attachments: [
                {
                  path: _filePath + _fileName
                }
              ]
            });
            // log ???????????????????????????????????????????????????????????????-??????????????????
            console.log('Message sent: %s', info.messageId);

            logger.info("Update Movement NotifyFlag");
            for (let index = 0; index < _data.length; index++) {
              const element = _data[index];
              await InquiryDao.update("update ttinvmovement set notifyFlag=1 where documentNbr='" + element.Document + "'");

              logger.info("Update Movement NotifyFlag : DocumentNbr : ", element.Document);
            }

          }

        }

        //=== End Movement ====================================================


      }


      return true;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }

}

async function GetSenderMail(_datas) {

  let _mail = "";

  for (let index = 0; index < _datas.length; index++) {
    const element = _datas[index];
    if (_mail == "") {
      _mail += element.email;
    } else {
      _mail += ";" + element.email;
    }

  }

  return _mail;
}

async function GetSenderName(_datas) {

  let _name = "";

  for (let index = 0; index < _datas.length; index++) {
    const element = _datas[index];
    if (_name == "") {
      _name += element.name + " " + element.lastName;
    } else {
      _name += ", " + element.name + " " + element.lastName;
    }

  }

  return _name;
}

module.exports = ImportProcessor;
