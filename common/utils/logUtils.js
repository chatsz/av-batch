'use strict';
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const LogzioWinstonTransport = require('winston-logzio');
const fs = require('fs');
const path = require('path');
const config = require('../../config/winston.json');
//const rTracer = require('cls-rtracer'); //node v12.17.0
const util = require('util');

const logDir = path.dirname(config.api.dailyRotateFileTransport.filename);

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

//dailyRotateFileTransport
const dailyRotateFileTransport = new transports.DailyRotateFile(config.api.dailyRotateFileTransport);

//logzioWinstonTransport
const logzioWinstonTransport = new LogzioWinstonTransport(config.api.logzioWinstonTransport);

const rTracerFormat = format.printf((info) => {
  //const rid = rTracer.id();
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

function getLogger() {
        return logger;
}

// fetch logger and export
module.exports = getLogger();
module.exports.logger = getLogger();
