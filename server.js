// Config section
var port = (process.env.VMC_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0'|| 'localhost');

var express = require('express');
var server = express.createServer();
var dnode = require('dnode');

server.use(express.cookieParser());

var sessionCookieMaxAge=365*24*60*60*1000; // 1 year
server.use(express.session({ 
  secret: "ekosekret",
  cookie: { 
    path:'/',
    // domain:'.dev.axialdev.net',
    httpOnly:false,
    maxAge: sessionCookieMaxAge
  }
}));

//CORS middleware - not using
if (0){
  var allowCrossDomain = function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET'); // 'GET,PUT,POST,DELETE'
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
  }
  server.use(allowCrossDomain);
}
server.use(express.static(__dirname+ '/public'));

var counters={}; // counter by Name
var answers={}; // answer arrays by questId

var services = {
  // incrments named counters use incr=0 to get current count
  // later split incr/get/reset with security
  count: function(name,incr,cb){
    counters[name] = counters[name] || 0;
    counters[name]+=incr;
    if(cb) cb(null,counters[name]);
    // broadcast...
    var message = 'hit count['+name+']='+counters[name]
    broadcast(message,'count',name,counters[name]);
  },

  // error checking...
  getAnswers: function(questId,cb){
    var ans = answers[questId] || [];
    console.log('getA |vote|[',questId,']',ans.length);
    if(cb) cb(null,ans);
  },
  
  vote: function(questId,answer,cb){
    // console.log('vote','q',questId,'a',answer);

    answers[questId] = answers[questId] || [];
    answers[questId].push(answer);

    console.log('|vote|[',questId,']',answers[questId].length);
    if(cb) cb(null,answers[questId].length);
    var message = 'new VOTE['+questId+']='+JSON.stringify(answer);
    broadcast(message,'vote',questId,answer);
    // broadcast(message);
    return;
    
    var previousRating=0;
    if (req && req.session){ // bypass for dnode invocation
      req.session.votes = req.session.votes || {};
      previousRating=req.session.votes[id] || 0
      if (!rating){
        delete req.session.votes[id];
      } else {
        req.session.votes[id]=rating;
      }
    }

  }
};

jsonrpc_services = require('connect-jsonrpc')(services);
server.post('/jsonrpc', function(req, res, next){
  jsonrpc_services(req,res,next);    
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
  this.count=services.count;
  this.vote=services.vote;
  this.getAnswers=services.getAnswers;

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

function broadcast(msg,type,id,thing){
  // console.log('bcast[type,id,thing]',type,id,thing);
  clients.forEach(function(client){
    client.log(msg);
    if (type=='count'){
      console.log('bcast update count',id,thing);
      client.updateCount(id,thing);
    } else if (type=='vote' && id && thing){
      client.updateVote(id,thing);
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
