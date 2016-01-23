'use strict';

var config = require('../config');
var Sequelize = require('sequelize');

module.exports = config.sequelize.define('SubscriptionModel', {
    idSubscription: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    target: {
      type: Sequelize.INTEGER,
      field: 'target'
    },
    targetType: {
      type: Sequelize.ENUM,
      values : [config.targetType.POST, config.targetType.PRODUCT],
      field: 'targetType'
    },
    action: {
      type: Sequelize.ENUM,
      values : [config.action.COMMENT,config.action.LIKE,config.action.REVICEMSG],
      field: 'action'
    },
    user: {
      type: Sequelize.STRING,
      field: 'user'
    },
    createAt: {
      type: Sequelize.DATE,
      field: 'createAt',
      defaultValue : Sequelize.NOW
    }
  }, {
    tableName: 'Subscription'
  });