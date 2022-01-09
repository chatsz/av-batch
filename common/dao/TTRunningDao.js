'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const models = require('../models');
const db = require("../../common/models").sequelize;
const dateUtil = require('../../common/utils/dateUtils');

// call module
module.exports = {
    getNextOrderRunning
}

async function getNextOrderRunning() {
    try {
        let _dt = new Date();
        let model = { nYear: _dt.getYear(), sType_running: "ORD" }
        let result = await getLast(model);

        console.log("RUNNING : ", result);

        model.sUpdateDate = dateUtil.dateString(_dt);
        model.sUpdateTime = dateUtil.timeString(_dt);

        if (result == null) {
            model.nRunning = "1";
            await create(model);
        } else {
            let _nextRunning = parseInt(result.nRunning) + 1;
            model.nRunning = _nextRunning.toString();
            await update(model);
        }

        var str = model.nRunning;
        var pad = "0000000000";
        var ans = "IMO" + pad.substring(0, pad.length - str.length) + str;

        return ans;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getLast(criteria) {
    try {
        let condition = {};
        condition.nYear = { [Op.eq]: criteria.nYear };
        condition.sType_running = { [Op.eq]: criteria.sType_running };

        return await models.TTRunning.findOne({
            where: condition
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function create(model) {
    let transaction = await db.transaction();

    try {
        let result = await models.TTRunning.create(model,
            {
                transaction
            });

        transaction.commit();

        return result;
    } catch (err) {
        transaction.rollback();
        console.log(err);
        throw err;
    }
}

async function update(model) {
    let transaction = await db.transaction();

    try {
        let condition = {};
        condition.nYear = { [Op.eq]: model.nYear };
        condition.sType_running = { [Op.eq]: model.sType_running };
        let result = await models.TTRunning.update(model, {
            transaction,
            where: condition
        });

        transaction.commit();
        return result;
    } catch (err) {
        transaction.rollback();
        console.log(err);
        throw err;
    }
}
