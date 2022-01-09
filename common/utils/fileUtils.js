const fs = require('fs-extra');
const path = require('path');
const dateFormat = require('dateformat');

function mkdir(location) {
    try {
            let normalizedPath = path.normalize(location);
            let parsedPathObj = path.parse(normalizedPath);
            let curDir = parsedPathObj.root;
            let folders = parsedPathObj.dir.split(path.sep);
            folders.push(parsedPathObj.base);
            for(let part of folders) {
                curDir = path.join(curDir, part);
                if (!fs.existsSync(curDir)) {
                    fs.mkdirSync(curDir);
                }
            }
    } catch (e) {
      logger.error(e);
      throw e;
    }
}

module.exports.mkdirSyncP = function(location) {
        mkdir(location);
}

module.exports.archiveFile = function(fileName, filePath, archivePath) {
    const logger = require("./logBatchUtils");
    try {
            let targetPath = archivePath.replace("{date}", dateFormat(new Date(), "yyyymmdd"));

            if (!fs.existsSync(targetPath)){
                mkdir(targetPath);     
            }

            let srcfilePath = filePath + fileName;
            let archiveFilePath = targetPath + fileName;

            logger.info("srcfilePath: ", srcfilePath)
            logger.info("archiveFilePath: ", archiveFilePath)

            //Copy FIle
            fs.copyFileSync(srcfilePath, archiveFilePath);

            //Delete File
            fs.removeSync(srcfilePath);

            logger.info("deleteFile: ", srcfilePath);
    } catch (e) {
        logger.error(e);
        throw e;
    }
}
