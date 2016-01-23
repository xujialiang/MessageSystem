'use strict';

var config = require('../config');
var Sequelize = require('sequelize');

module.exports = config.sequelize.define('UserNotifyModel', {
    idUserNotify: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    isRead: {
      type: Sequelize.BOOLEAN,
      field: 'isRead'
    },
    user: {
      type: Sequelize.STRING,
      field: 'user'
    },
    notify: {
      type: Sequelize.INTEGER,
      field: 'notify'
    },
    createAt: {
      type: Sequelize.DATE,
      field: 'createAt',
      defaultValue : Sequelize.NOW
    }
  }, {
    tableName: 'UserNotify'
  });