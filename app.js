// Config section
var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');

//var orm = require('./lib/orm');
// not yet, see im-w for example invocation fro services

// if local ?
//server.use(express.logger());
server.use(express.static(__dirname+ '/public'));

var tally={};
var services = {
  zing : function (n, cb) { // cb(err,result)
    console.log('called server zing',n);
    if (n>100){
      console.log('n is too large');
      cb({code:-1,message:"n is too large"},null);
      return;
    }
    cb(null,n * 100);
  },
  vote: function(id,rating,cb){
    // console.log('voting for id:%s rating:%d',id,rating);
    tally[id] = tally[id]||{sum:0,count:0};
    rating = new Number(rating);
    if (rating && !isNaN(rating)){
      tally[id].count++;
      tally[id].sum+=rating;
    }
    console.log('voted for id:%s rating:%d',id,rating,tally[id]);
    cb(null,tally[id]);
  }
};

jsonrpc_services = require('connect-jsonrpc')(services);

server.post('/jsonrpc', function(req, res, next){
  jsonrpc_services(req,res,next);    
});

server.enable("jsonp callback");
server.get('/vote/:id', function(req, res){
  var id = req.param('id');
  var rating = req.param('rating');
  services.vote(id,rating,function(err,tally){
    res.json(tally);
  });
});

var ioOpts= (process.env.VMC_APP_PORT)?{
  'transports': [
  //'websocket',
  //'flashsocket',
  //'htmlfile',
  'xhr-polling',
  'jsonp-polling'
  ]   
}:{};
dnode(services).listen(server,{ io : ioOpts});

if (!process.env.VMC_APP_PORT) {
  // also listen to 7070 directly (locally)
  dnode(services).listen(7070);
}


server.listen(port, host);
console.log('http://'+host+':'+port+'/');
