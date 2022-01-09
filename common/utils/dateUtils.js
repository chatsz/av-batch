module.exports.convert = function(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

module.exports.convertForSqlFromDate = function(param) {
    let date = new Date(param);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
}

module.exports.convertForSqlToDate = function(param) {
    let date = new Date(param);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59));
}

module.exports.now = function() {
    const dayjs = require('dayjs');
    return dayjs().format("YYYY-MM-DDTHH:mm:ss");
}

module.exports.dateString = function(_date) {
    const dayjs = require('dayjs');
    return dayjs(_date).format("YYYYMMDD");
}

module.exports.timeString = function(_date) {
    const dayjs = require('dayjs');
    return dayjs(_date).format("HHmmss");
}