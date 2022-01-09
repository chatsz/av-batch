"use strict";
const csvjson = require("csvjson");
const logger = require("../../common/utils/logBatchUtils");
const dayjs = require("dayjs");
const db = require("../../common/models").sequelize;
const fsp = require("fs-extra").promises;
const path = require("path");
const localPath = require('../../config/batch.json').localPath;
const fileUtil = require('../../common/utils/fileUtils');
const asyncUtil = require("../../common/utils/asyncUtil");
const importPath = require('../../config/batch.json').importPath;


class ScanFileProcessor {
    constructor() { }

    async process() {

        const directoryName = importPath.path;

        let _result = await scan(directoryName)

        return _result;

        async function scan(directoryName, results = []) {
            let files = await fsp.readdir(directoryName, { withFileTypes: true });
            for (let f of files) {
                let fullPath = path.join(directoryName, f.name);
                if (!f.isDirectory()) {

                    results.push(fullPath);
                }
            }
            return results;
        }

    }

}

module.exports = ScanFileProcessor;
