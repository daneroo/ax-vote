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
//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET'); // 'GET,PUT,POST,DELETE'
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
server.use(allowCrossDomain);

var tally={};
var services = {
  zing : function (n, cb) { // cb(err,result)
    // console.log('called server zing',n);
    if (n>100){
      // console.log('n is too large');
      cb({code:-1,message:"n is too large"},null);
      return;
    }
    cb(null,n * 100);
  },
  /* this was the cookie seting loginc in php
  $app->get('/vote', function() use($app) {
      $ip=$_SERVER['REMOTE_ADDR']; 
      error_log('voting from '.$ip);
      $voteId = $app->getCookie('vote_id');
      if ($voteId === NULL){
          $voteId=time()+26315569;
          $app->setCookie('vote_id', $voteId,'1 minutes');
          error_log('first vote for '.$voteId);
      } else {
          // refresh timeout...
          $app->setCookie('vote_id', $voteId,'1 minutes');
          error_log('replace vote for '.$voteId);
      }

      $app->response()->write('1'); //DO NOT REMOVE, is called periodically to avoid session timeout
  });
  */
  vote: function(id,rating,cb){
    // console.log('voting for id:%s rating:%d',id,rating);
    tally[id] = tally[id]||{sum:0,count:0};
    rating = new Number(rating);
    if (rating && !isNaN(rating)){
      tally[id].count++;
      tally[id].sum+=rating;
    }
    // console.log('voted for id:%s rating:%d',id,rating,tally[id]);
    broadcast('somone rated: '+id+' with a rating of: '+rating,id,tally[id]);
    cb(null,tally[id]);
  }
};

jsonrpc_services = require('connect-jsonrpc')(services);

server.post('/jsonrpc', function(req, res, next){
  jsonrpc_services(req,res,next);    
});

server.enable("jsonp callback");
server.get('/vote', function(req, res){
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

// var dns = dnode(services);
var clients=[];
var dns = dnode(function(client,con){
  this.zing=services.zing;
  this.vote=services.vote;
  con.on('ready', function () {
    clients.push(client);
    broadcast('added a client: '+clients.length);
  });
  con.on('end', function () {
    var idx = clients.indexOf(client);
    if (idx!=-1) clients.splice(idx, 1);
    // else: should never happen
    broadcast('removed client: '+clients.length);
  });
});

function broadcast(msg,id,tally){
  clients.forEach(function(client){
    client.log(msg);
    if (id && tally){
      client.update(id,tally);
    }
  });
}

setInterval(function(){broadcast('server heart beat: '+new Date())},30000);

dns.listen(server,{ io : ioOpts});

if (!process.env.VMC_APP_PORT) {
  // also listen to 7070 directly (locally)
  dns.listen(7070);
}


server.listen(port, host);
console.log('http://'+host+':'+port+'/');
