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
  getTally: function(cb){
    cb(null,tally);
  },
  vote: function(id,rating,req,cb){
    tally[id] = tally[id]||{sum:0,count:0};
    rating = +rating;
    // validate rating: must be 1,..5: else null
    if (rating===null || isNaN(rating) || rating<1 || rating>5){
      rating=null;
    }

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

    if (previousRating){
      tally[id].count--;
      tally[id].sum-=previousRating;
    }
    if (rating){
      tally[id].count++;
      tally[id].sum+=rating;
    }
    var message='nothing happened'
    if (previousRating && rating){
      message='somone replaced their rating for: '+id+' rating: '+rating+' previous rating:'+previousRating;
    } else if (rating){
      message='somone rated: '+id+' with a rating of: '+rating;
    } else if (previousRating){
      message='somone removed their rating for: '+id+' previous rating:'+previousRating;
    }
    broadcast(message,id,tally[id]);
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
  // console.log(req.sessionStore);
  services.vote(id,rating,req,function(err,tally){
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
  this.getTally=services.getTally;
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
