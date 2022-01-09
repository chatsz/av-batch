module.exports.toString = function(str) {
    let newStr = '\"\"';
    if ( str !== null && str !== undefined && str !== '') {
        newStr = '\"' + str + '\"';
    }
    return newStr;
}

module.exports.toDateStr = function(date) {
    let newStr = '\"\"';
    if ( date !== null && date !== undefined && date !== '') {
        newStr = '\"' + date + '\"';
    }
    return newStr;
}

module.exports.toDateISO = function(date) {
    const dateFormat = require('dateformat');
    let newStr = '\"\"';
    if ( date !== null && date !== undefined && date !== '') {
        newStr = '\"' + dateFormat(date, "yyyy-mm-dd'T'HH:MM:ss") + '\"';
    }
    return newStr;
}

module.exports.toDateYYYYMMDD = function(date) {
    const dateFormat = require('dateformat');
    let newStr = '\"\"';
    if ( date !== null && date !== undefined && date !== '') {
        newStr = '\"' + dateFormat(date, "yyyymmdd") + '\"';
    }
    return newStr;
}

module.exports.toNumber = function(amt) {
    let newStr = '\"\"';
    if ( amt !== null && amt !== undefined && amt !== '') {
        newStr = '\"' + parseFloat(amt) + '\"';
    }
    return newStr;
}

module.exports.toAmtNumber = function(amt) {
    let newStr = '\"\"';
    if ( amt !== null && amt !== undefined && amt !== '') {
        newStr = '\"' + parseFloat(amt).toFixed(2) + '\"';
    }
    return newStr;
}

module.exports.getStrByDate = function(str, date) {
    let newStr = str.replace(/\${date}/g, date);
    return newStr;
}

module.exports.isDecimal = function(str, decimal) {
    let index = str.indexOf(".");
    let len = str.length - index - 1;

    return !isNaN(str) && !isNaN(parseFloat(str)) && len == decimal && index > 0;
}

module.exports.isNumber = function(str) {

    return !isNaN(str) && !isNaN(parseFloat(str));
}

module.exports.isPhoneNumber = function(str) {

    //+662-2380895
    let mobile = /^\+?([0-9]{3})\)?[-]?([0-9]{7})$/;

    //+02-2380895-8
    let phone1 = /^\+?([0-9]{2})\)?[-]?([0-9]{7})[-]?([0-9]{1})$/;

    //+02-2380895
    let phone2 = /^\+?([0-9]{2})\)?[-]?([0-9]{7})$/;

    return (str.match(mobile) && str.length==12)||( str.match(phone1) && str.length==13)||(str.match(phone2) && str.length==11);
}

module.exports.parseNumber = function(amt) {
    let newNumber = 0;
    if ( amt !== null && amt !== undefined && amt !== '') {
        newNumber = parseFloat(amt);
    }
    return newNumber;
}
