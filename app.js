var restify = require('restify');
var Sequelize = require('sequelize');
var Notify = require('./model/NotifyModel');
var UserNotify = require('./model/UserNotifyModel');
var Subscription = require('./model/SubscriptionModel');
var SubscriptionConfig = require('./model/SubscriptionConfigModel');
var config = require('./config');

var server = restify.createServer({
  name: 'message api',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// 往Notify表中插入一条公告记录
server.post('/createAnnounce', function (req, res, next) {
  Notify.create({content : req.params.content, notify_type : 1,sender:req.params.sender}).then(function(user) {
    res.send({code:0,msg:'success'});
    return next();
  });
  
});

// 往Notify表中插入一条提醒记录
server.post('/createRemind', function (req, res, next) {
  Notify.create({target : req.params.target,
                 targetType : req.params.targetType, 
                 notify_type : 2,
                 sender:req.params.sender,
                 action: req.params.action,
                 content:req.params.content
  }).then(function(user) {
    res.send({code:0,msg:'success'});
    return next();
  });
});

// 往Notify表中插入一条信息记录
// 往UserNotify表中插入一条记录，并关联新建的Notify
server.post('/createMessage', function (req, res, next) {
    Notify.create({notify_type : 3,
                  sender:req.params.sender,
                  content:req.params.content
    }).then(function(notify) {
        UserNotify.create({
          isRead:0,
          user:req.params.receiver,
          notify:notify.idNotify,
        }).then(function(usernotify){
          res.send({code:0,msg:'success'});
          return next();
        });
    });
});

// 1.从UserNotify中获取最近的一条公告信息的创建时间: lastTime
// 2.用lastTime作为过滤条件，查询Notify的公告信息
// 3.新建UserNotify并关联查询出来的公告信息
server.post('/pullAnnounce', function (req, res, next) {
  //1.
  config.sequelize.query('SELECT * from (SELECT a.idUserNotify,a.isRead,a.user,a.notify,a.createAt as userNotifyCreateAt,b.idNotify,b.content,b.type,b.target,b.targetType,b.action,b.sender,b.createAt as notifyCreateAt FROM yicoolmsg.UserNotify as a , yicoolmsg.Notify as b where a.notify = b.idNotify) as c where type = $1 ORDER BY notifyCreateAt desc limit 1;',
    { bind: ['1'], type: config.sequelize.QueryTypes.SELECT}
  ).then(function(result) {
    if(result.length>0){
      //2.
      Notify.findAll({where:{
        createAt:{
          $gt:result[0].notifyCreateAt
        }
      }}).then(function(result){
        //3.
        for(var obj in result){
          UserNotify.create({
            isRead:0,
            user:req.params.sender,
            notify:result[obj].idNotify,
          });
        }
        res.send({code:0,msg:'success',data:result});
      });
    }else{
      res.send({code:-1,msg:'failed'});
    }
    return next();
  });
});

// 1.查询用户的订阅表，得到用户的一系列订阅记录
// 2.通过每一条的订阅记录的target、targetType、action、createdAt去查询Notify表，获取订阅的Notify记录。（注意订阅时间必须早于提醒创建时间）
// 3.查询用户的配置文件SubscriptionConfig，如果没有则使用默认的配置DefaultSubscriptionConfig
// 4.使用订阅配置，过滤查询出来的Notify
// 5.使用过滤好的Notify作为关联新建UserNotify
server.post('/pullRemind', function (req, res, next) {
    
    var subscription_result;
    var subscriptionconfig_result;
    
    //1.
    Subscription.findAll({where:{
        user:req.params.user    
    }}).then(function(result){
        subscription_result = result;
        if(result.length>0){
            //3.
            SubscriptionConfig.findAll({where:{
                user:req.params.user
            }}).then(function(result){
                subscriptionconfig_result = result;
                //2.
                var filterParam = [];
                subscription_result.forEach(function(obj){
                    var param = {
                        type:2,//提醒
                        target:obj.target,
                        targetType:obj.targetType,
                        action:obj.action,
                        createAt:{
                            $gt:obj.createAt // 提醒创建时间 晚于 订阅时间
                        },
                        idNotify:{
                            $gt:req.params.idLatestUserNotify
                        }
                    };
                    filterParam.push(param);
                });
                Notify.findAll({where:{
                    $or:filterParam
                }}).then(function(result){
                    if(result.length>0){
                        //4.
                        var toSaveData = new Array();
                        result.forEach(function(notifydata){
                            if (notifydata.action == config.action.comment || 
                                notifydata.action == config.action.like ||
                                notifydata.action == config.action.receivemsg) {
                                var obj={
                                    isRead:0,
                                    user:req.params.user,
                                    notify:notifydata.idNotify,
                                };
                                toSaveData.push(obj);
                            }
                        });
                        //5.
                        var returnResult = function(){
                              config.sequelize.query('SELECT * from (SELECT a.idUserNotify,a.isRead,a.user,a.notify,a.createAt as userNotifyCreateAt,b.idNotify,b.content,b.type,b.target,b.targetType,b.action,b.sender,b.createAt as notifyCreateAt FROM MsgSystem.UserNotify as a , MsgSystem.Notify as b where a.notify = b.idNotify and b.type = 2) as c ORDER BY notifyCreateAt desc;',
                                                { bind: [], type: config.sequelize.QueryTypes.SELECT}
                              ).then(function(result) {
                                res.send({code:0,msg:'success',data:result});
                                return next();
                            });  
                        }
                        UserNotify.bulkCreate(toSaveData).then(function(result){
                            returnResult();
                        },function(error){
                            returnResult();
                        }); 
                    }else{
                        res.send({code:0,msg:'success',data:[]});//没有订阅任何消息
                        return next();
                    }
                });
            }); 
        }else{
            res.send({code:0,msg:'success',data:[]});//没有订阅任何消息
            return next();
        }
         
    });
});

// 通过reason，查询NotifyConfig，获取对应的动作组:actions
// 遍历动作组，每一个动作新建一则Subscription记录
server.post('/subscribe', function (req, res, next) {
    if(req.params.reason == 'create_product'){
        config.reasonAction.create_product.forEach(function(element) {
            Subscription.create({
                target: req.params.target, 
                targetType: config.targetType.PRODUCT,
                action: element,
                user: req.params.user
            });
        }, this);
    }else if(req.params.reason == 'like_product'){
      config.reasonAction.like_product.forEach(function(element) {
            Subscription.create({
                target: req.params.target, 
                targetType: config.targetType.PRODUCT,
                action: element,
                user: req.params.user
            });
        }, this);
      
    }else if(req.params.reason == 'like_post'){
      config.reasonAction.like_post.forEach(function(element) {
            Subscription.create({
                target: req.params.target, 
                targetType: config.targetType.POST,
                action: element,
                user: req.params.user
            });
        }, this);
    }else if(req.params.reason == 'create_post'){
      config.reasonAction.create_post.forEach(function(element) {
            Subscription.create({
                target: req.params.target, 
                targetType: config.targetType.POST,
                action: element,
                user: req.params.user
            });
        }, this);
    }
    res.send({code:0,msg:'success'});
    return next();
});

// 删除user、target、targetType对应的一则或多则记录
server.post('/cancelSubscription', function (req, res, next) {
    Subscription.findAll({where:{
                            user:req.params.user,
                            targetType:req.params.targetType,
                            target:req.params.target
                          }
    }).then(function(result){
        result.forEach(function(data){
            data.destroy();
        });
        res.send({code:0,msg:'success'});
        return next();
    });
});

// 查询SubscriptionConfig表，获取用户的订阅配置
server.post('/getSubscriptionConfig', function (req, res, next) {
    Subscription.findAll({where:{
                            user:req.params.user
                          }
    }).then(function(result){
        res.send({code:0,msg:'success',data:result});
        return next();
    });
});

// 更新用户的SubscriptionConfig记录
server.post('/updateSubscriptionConfig', function (req, res, next) {
    Subscription.findAll({where:{
                            user:req.params.user
                          }
    }).then(function(result){
        if(result.length>0){
            result[0].update({
                action:req.params.action
            });
        }else{
            Subscription.create({
                action:req.params.action,
                user:req.params.user
            });
        }
        res.send({code:0,msg:'success'});
        return next();
    });
});

// 获取用户的消息列表
server.post('/getUserNotify', function (req, res, next) {
    UserNotify.findAll({where:{
        user:req.params.user
    }}).then(function(result){
        res.send({code:0,msg:'success',data:result});
        return next();
    });
});

// 更新指定的notify，把isRead属性设置为true
server.post('/read', function (req, res, next) {
  UserNotify.findAll({where:{
        user:req.params.user,
        notify:req.params.notify
    }}).then(function(result){
        if(result.length>0){
          result[0].isRead = true;
          result[0].save().then(function(result){
            res.send({code:0,msg:'success'});
            return next();
          });
        }else{
          res.send({code:-1,msg:'failed'});
          return next();
        }
    });
});


server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});