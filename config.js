'use strict';
var Sequelize = require('sequelize');

exports.sequelize =  new Sequelize("MsgSystem", "root", "xjl3.1415926", {
    host: "mysql.xujialiang.net",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    define: {
          timestamps: false
      }
  });
  
// 提醒关联的目标类型
exports.targetType = {
    PRODUCT:"product",
    POST:"post"
  };
  
// 提醒关联的动作
exports.action = {
  comment   : 'comment',  // 评论
  like      : 'like',     // 喜欢
  receivemsg : 'receivemsg'// 收到私信
};

// 订阅原因对应订阅事件
exports.reasonAction = {
  create_product  : ['comment', 'like'],
  like_product    : ['comment'],
  like_post       : ['comment'],
  create_post     : ['comment','like']
}

// 默认订阅配置
exports.defaultSubscriptionConfig={
  comment   : true,    // 评论
  like      : true,    // 喜欢
  receivemsg : true    // 私信
}