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

const avImportProcessor = require('./AVImportProcessor');

const scanFileProcessor = require('./ScanFileProcessor');

class ImportProcessor {
  constructor() { }

  async process() {

    try {
      logger.info("Start Process Import File");
      logger.info("Version 1.0.1");

      logger.info("Scan File..");

      const _avImportProcessor = new avImportProcessor();

      const _scanFileProcessor = new scanFileProcessor();

      let files = await _scanFileProcessor.process();

      console.log("Files: ", files);

      await asyncUtil.asyncForEach(files, async (data) => {

        console.log("file->", data);

        const fName = path.basename(data);
        const pName = path.dirname(data);

        console.log("pName->", pName);
        console.log("fName->", fName);

        const importFile = data;
        const newFile =  importPath.archive + fName + "_" + Date.now().toString();

        console.log("nFile->",newFile);

        await _avImportProcessor.process(importFile, newFile);       

      });

      return true;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

}

module.exports = ImportProcessor;
