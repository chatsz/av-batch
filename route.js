'use strict';

//Validator

const validateRequest = require("./api/req/requestValidator");

//Route
const ms = require('ms');
const router = require('express').Router();
const batchJobService = require('./api/req/batchJobService');

//batchJobRq
router.route('/etax/batchJobRq')
	.post(setConnectionTimeout('5m'),
		passport.authenticate,
		batchJobService.batchJobRq);

//setConnectionTimeout
function setConnectionTimeout(time) {
	let delay = typeof time === 'string'
		? ms(time)
		: Number(time || 30 * 1000 );	//Default 30s

	return function (req, res, next) {
		res.connection.setTimeout(delay);
		next();
	}
}

module.exports = router;
