'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const models = require('../models');

// call module
module.exports = {
    create,
    deleteAll
 
}

async function create(transaction, model) {
    try {                   
        let result = await models.tmusercust.create(model,
            {
                transaction                
            });

        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function deleteAll(transaction) {
    try {                   
         await models.tmusercust.destroy(
            {
                transaction,
                where: {},
                truncate: true                
            });

        return true;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
