// Config section
var port = (process.env.VMC_APP_PORT || 8080);
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
var contestOpen=true; // should be a llokup by questId

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
    // console.log('getA |vote|[',questId,']',ans.length);
    if(cb) cb(null,ans);
  },
  
  getContestState: function(cb){
    if(cb) cb(null,contestOpen);
  },
  setContestState: function(state,cb){
    contestOpen=state;
    if(cb) cb(null,contestOpen);
    var message = 'contest is now '+((contestOpen)?'open':'closed');
    broadcast(message,'contestState',contestOpen);
  },
  registerVoter: function(voterId,questId,cb){
    voterId=voterId||'gre-'+new Date().getTime()+'-'+(10000+Math.round(Math.random()*10000));
    // console.log('voter Id',voterId);
    
    var voteAllowed=canVote(voterId,questId);
    if(cb) cb(null,{ 
      voterId:voterId,
      canVote:voteAllowed,
      contestOpen:contestOpen
    });
  },
  
  vote: function(questId,answer,cb){
    // console.log('vote','q',questId,'a',answer);
    if (!contestOpen){
      if(cb) cb({message:'Le concours est fermé'});
      return;
    }
    var voteAllowed=canVote(answer.voterId,questId);
    if (!voteAllowed){
      if(cb) cb({message:'Vote déja enregistré'});
      return;
    }

    answer.stamp=new Date().toISOString();
    answers[questId] = answers[questId] || [];
    answers[questId].push(answer);

    // console.log('|vote|[',questId,']',answers[questId].length);
    if(cb) cb(null,answers[questId].length);
    var message = 'vote '+questId+'-'+answer.voterId;
    broadcast(message,'vote',questId,answer);
  },
  unvote: function(questId,voterId,cb){
    if (answers[questId]){
      // console.log('Checking',answers[questId].length,'votes to remove voterId',voterId);
      var filtered = [];
      answers[questId].forEach(function(a){
        // console.log('checking',voterId,'!=',a.voterId);
        if (voterId!=a.voterId) filtered.push(a);
      });
      // if we removed at least one
      if (answers[questId].length!=filtered.length){
        // swap the filtered set
        answers[questId]=filtered;
        var message = 'unvote '+questId+'-'+voterId;
        broadcast(message,'unvote',questId,voterId);
      }
    }
    if(cb) cb(null,answers[questId].length);
  }
};

function canVote(voterId,questId){
  var canVote=true;
  if (answers[questId]){
    answers[questId].forEach(function(a){
      if (voterId==a.voterId) canVote=false;
    });
  }
  return canVote;
}

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
  this.getAnswers=services.getAnswers;
  this.getContestState=services.getContestState;
  this.setContestState=services.setContestState;
  this.registerVoter=services.registerVoter;
  this.vote=services.vote;
  this.unvote=services.unvote;

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
      client.updateCount(id,thing);
    } else if (type=='contestState'){
      client.updateContestState(id)
    } else if (type=='unvote'){
      client.updateUnvote(id,thing)
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
