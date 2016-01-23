'use strict';

var config = require('../config');
var Sequelize = require('sequelize');

module.exports = config.sequelize.define('SubscriptionConfigModel', {
    idSubscriptionConfig: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    action: {
      type: Sequelize.STRING,
      field: 'action'
    },
    user: {
      type: Sequelize.STRING,
      field: 'user'
    }
  }, {
    tableName: 'SubscriptionConfig'
  });