module.exports.code = Object.freeze({
    SUCCESS: 0,
    NOTFOUND: 13,
    DUPPLICATE: 14,
    ERROR: 9999
});

module.exports.msg = Object.freeze({
    SUCCESS: 'success',
    NOTFOUND: 'err.notfound',
    DUPPLICATE: 'err.dupplicate',
    ERROR: 'err.500'
});


module.exports.callback = function(code, msg, data) {
    return { responseCode: code, responseMsg: msg, data: data };
}

module.exports.callbackSuccess = function(data) {
    return { responseCode: 0, responseMsg: null, data: data };
}

module.exports.callbackPaging = function(data,totalPage,totalRecord) {
	return { responseCode: 0, responseMsg: null, data: data, totalPage: totalPage, totalRecord: totalRecord  };
}

module.exports.errorMessage = function(errorCode, errorMessage) {
    return { errMsg : { code: errorCode, message: errorMessage } };
}
