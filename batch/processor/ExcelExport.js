"use strict";
const xlsx = require("xlsx")
const logger = require("../../common/utils/logBatchUtils");

class ExcelExport {
    constructor() { }

    async export(data, excelFileName) {

        try {

            const workBook = xlsx.utils.book_new(); // create a new blank book
            const workSheet = xlsx.utils.json_to_sheet(data);

            xlsx.utils.book_append_sheet(workBook, workSheet, 'data'); // add the worksheet to the book
            xlsx.writeFile(workBook, excelFileName); // initiate a file download in browser

        } catch (e) {
            logger.error(e);
            throw e;
        }

    }

}

module.exports = ExcelExport;