'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const models = require('../models');

// call module
module.exports = {
    get,
    create,
    update,
    getPendingProcess
}

async function get(criteria) {
    try {
        let condition = {};
        condition.nUploadID = { [Op.eq]: criteria.nUploadID };
        return await models.TMUploadLog.findOne({
            where: condition
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function create(transaction, model) {
    try {
        if (model.sRemark != "") {
            model.sStatus = "FAILED";
        }
       
        let result = await models.TMUploadLog.create(model, {
            transaction
        });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function update(transaction, model) {
    try {
        if (model.sRemark != "") {
            model.sStatus = "FAILED";
        }

        let condition = {};
        condition.nUploadID = { [Op.eq]: model.nUploadID };
        let result = await models.TMUploadLog.update(model, {
            transaction,
            where: condition
        });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getPendingProcess() {
    try {
        let condition = {};
        condition.sStatus = { [Op.eq]: 'PROCESSING' };
        return await models.TMUploadLog.findAll({
            where: condition
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
}