const config = require('./config/batch.json').jobs;
const cron = require('node-cron');
const logger = require("./common/utils/logBatchUtils");

const importJob = require('./batch/importJob');


//ImportTask
let importTask = cron.schedule(config.importJob.jobScheduler.cron, () =>  {
  importJob.run();
}, {
      scheduled: true,
      timezone: "Asia/Bangkok"
});

//Start Job

logger.info("Start Scheduler Task");
logger.info("Job cron : ", config.importJob.jobScheduler.cron);
importTask.start();
logger.info("Success : Start Job cron");