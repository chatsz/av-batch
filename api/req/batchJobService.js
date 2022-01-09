"use strict";
const logger = require('../../common/utils/logUtils');
const child_process = require("child_process");

const importJob = require('../../batch/importJob');

module.exports = {
    batchJobRq
}

async function batchJobRq(req, res) {
    try {

        logger.info("batchJobService: batchJobRq...");
        logger.info("batchJobRq = " + JSON.stringify(req.body));
        let job = req.body.jobName;

        switch (job) {
            case "importJob":
                importJob.run();
                break;
            default:
                return res.status(500).json("jobName is Invalid.");
        }

        //return status
        res.status(200).send('Submitted');

    } catch (e) {
        logger.error(e);
        res.status(500).json(e.message);
    }
}
