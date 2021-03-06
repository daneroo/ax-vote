// Dependancies for json-rpc and dnode clients 
var dnode = require('dnode');
var jsonrpc = require('./lib/jsonrpc-client');
var request = require('request');

// json-rpc part
var endpoint='http://localhost:3000/jsonrpc';
//var endpoint='http://ax-vote.cloudfoundry.com/jsonrpc';
var client = jsonrpc('http://localhost:3000/jsonrpc');
var method='zing';
var params=[44]; //{ n: param }, 
client.call(method,params,function(err, result) {
        if (err){
            console.log('jsonrpc.zing('+params+') Error: ',err);
        } else {
            console.log('jsonrpc.zing('+params+') = ' + result);
        }
    }
);

// dnode part
dnode.connect(7070, function (remote, conn) {
    //console.log(conn);
    var param=42;
    remote.zing(param, function (err,result) {
        if (err){
            console.log('remote.zing('+param+') Error: ',err);
        } else {
            console.log('remote.zing('+param+') = ' + result);
        }
        conn.end();
    });
});
