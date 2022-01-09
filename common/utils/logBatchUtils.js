'use strict';
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const LogzioWinstonTransport = require('winston-logzio');
const fs = require('fs');
const path = require('path');
const config = require('../../config/winston.json');
//const rTracer = require('cls-rtracer'); //node v12.17.0
const util = require('util');

const logDir = path.dirname(config.batch.dailyRotateFileTransport.filename);

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

//dailyRotateFileTransport
const dailyRotateFileTransport = new transports.DailyRotateFile(config.batch.dailyRotateFileTransport);

//dailyRotateFileTransport
const dailyRotateJsonTransport = new transports.DailyRotateFile(config.batch.dailyRotateJsonTransport);

//logzioWinstonTransport
const logzioWinstonTransport = new LogzioWinstonTransport(config.batch.logzioWinstonTransport);

const rTracerFormat = format.printf((info) => {
  //const rid = rTracer.id(); //node v12.17.0
  const rid = undefined;
  const args = info[Symbol.for('splat')];
  const strArgs = (args || []).map((arg) => {
      return util.inspect(arg, {
          colors: false
      });
  }).join(' ');
  return rid
    ? `${info.timestamp} [rid:${rid}]: ${info.level}: ${typeof info.message === "object"?JSON.stringify(info.message):info.message+=strArgs}`
    : `${info.timestamp} ${info.level}: ${typeof info.message === "object"?JSON.stringify(info.message):info.message+=strArgs}`
});

const logger = createLogger({
  // change level if in dev environment versus production
  level: 'silly',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.json(),
    format.prettyPrint(),
    rTracerFormat
  ),
  transports: [
    new transports.Console({
      format: format.colorize({ level: true })
    }),
    dailyRotateFileTransport,
    logzioWinstonTransport
  ]
});

const jsonLogger = createLogger({
  // change level if in dev environment versus production
  level: 'silly',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.json(),
    format.prettyPrint(),
    rTracerFormat
  ),
  transports: [
    dailyRotateJsonTransport
  ]
});

function getLogger() {
        return logger;
}

function getJsonLogger() {
  return jsonLogger;
}

// fetch logger and export
module.exports = getLogger();
module.exports.logger = getLogger();
module.exports.batchJsonLogger = getJsonLogger();
