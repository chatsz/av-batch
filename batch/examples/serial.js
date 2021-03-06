
/**
 * Module dependencies.
 */

var Batch = require('batch');

var n = 10;
var batch = new Batch;

batch.concurrency(1);

while (n--) {
  (function(n){
    batch.push(function(done){
      console.log('  start : %s', n);
      setTimeout(function(){
        console.log('   done : %s', n);
        done();
      }, 200);
    })
  })(n);
}

batch.end();
