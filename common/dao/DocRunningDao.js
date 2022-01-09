'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const models = require('../models');

// call module
module.exports = {
    get,
    update
 
}

async function get(transaction, criteria) {
    try {        
        let condition = {};
        condition.tableName = { [Op.eq]: criteria.tableName };        
        return await models.docrunning.findOne({
            transaction,
            where: condition 
        });
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function update(transaction, model) {
    try {      
        let condition = {};       
        condition.tableName = { [Op.eq]: model.tableName };       
        let result = await models.docrunning.update(model, {
                transaction,
                where: condition
            });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}