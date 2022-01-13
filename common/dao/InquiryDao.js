'use strict';

const models = require('../models');
const { sequelize } = models;

// call module
module.exports = {
    inquiry,
    update
}

async function inquiry(sql) {

    try {

        const { QueryTypes } = require('sequelize');
        const result = await sequelize.query(sql, { type: QueryTypes.SELECT });

        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function update(sql) {

    try {

        const { QueryTypes } = require('sequelize');
        const result = await sequelize.query(sql, { type: QueryTypes.UPDATE });

        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
