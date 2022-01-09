'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const models = require('../models');

// call module
module.exports = {
    create,
    get,
    update
 
}

async function create(transaction, model) {
    try {                   
        let result = await models.tmitem.create(model,
            {
                transaction                
            });

        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function get(criteria) {
    try {        
        let condition = {};
        condition.itemCode = { [Op.eq]: criteria.itemCode };        
        return await models.tmitem.findOne({
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
        condition.itemID = { [Op.eq]: model.itemID };       
        let result = await models.tmitem.update(model, {
                transaction,
                where: condition
            });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}