const Batch = require('batch');
const ImportProcessor = require('./processor/ImportProcessor');
const logger = require('../common/utils/logBatchUtils');

module.exports.run = () => {
  const jobImport = new ImportProcessor();

  //New Batch
  let batch = new Batch;
  batch.concurrency(1); //serial = set concurrency(1);
  batch.push( done => {
      logger.info("Batch-start : ImportJob");

      //process
      jobImport.process()
      .then(result => {
        logger.info("ImportJob = " + JSON.stringify(result));
      })
      .catch(err => {
        logger.error(err.message);
      });
      
      done();
  });

  //Batch End
  batch.end();
}

//Options: execute from command-line => node ./batch/importJob.js run
require('make-runnable');
