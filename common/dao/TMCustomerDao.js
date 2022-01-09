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
        let result = await models.tmcustomer.create(model,
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
        condition.abCode = { [Op.eq]: criteria.abCode };        
        return await models.tmcustomer.findOne({
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
        condition.customerID = { [Op.eq]: model.customerID };       
        let result = await models.tmcustomer.update(model, {
                transaction,
                where: condition
            });
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}