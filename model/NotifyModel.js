'use strict';

var config = require('../config');
var Sequelize = require('sequelize');

module.exports = config.sequelize.define('NotifyModel', {
    idNotify: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: Sequelize.TEXT,
      field: 'content'
    },
    notify_type: {
      type: Sequelize.INTEGER,
      field: 'type'
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
    sender: {
      type: Sequelize.STRING,
      field: 'sender'
    },
    createAt: {
      type: Sequelize.DATE,
      field: 'createAt',
      defaultValue : Sequelize.NOW
    }
  }, {
    tableName: 'Notify'
  });