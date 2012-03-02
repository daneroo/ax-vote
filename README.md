# Ekomobi Live Voting Endpoint
##
Integration into ekomobi: use the ekowidget directive once, and the starvote/raing pair where needed.

    <div class="ekowidget"  data-injectjs="http://dirac.imetrical.com:3000/js/integrate.js" />
    <div class="ekowidget"  data-injectjs="http://ax-vote.cloudfoundry.com/js/integrate.js" />
    <div class="starvote" />
    <div class='rating'/>

## Initial deployment to cloudfoundry
When it's up, you can find it [here](http://ax-vote.cloudfoundry.com)

    # if not yet created... (add mongo later)
    vmc push ax-vote

    # to push an update
    vmc update ax-vote


## Boilerplate
Start from [HTML5 mobile boilerplate](https://github.com/h5bp/mobile-boilerplate) index.html.
Do not use it's build system, will try to minimise with express/connect.
  
* index.html
* add jQuery mobile, downgrade to jQ 1.6.4
* icons and startup
* js
* mobile-boookmark-bubble
* crossdomain
* appcache

## Transport and RPC

* [JSON-RPC Spec](http://jsonrpc.org/spec.html)
* [JSON-RPC connect middleware](https://github.com/visionmedia/connect-jsonrpc) by visionmedia (TJ Holowaychuk)
* [JSON-RPC client](https://github.com/andyfowler/node-jsonrpc-client)
* [JSON-RPC client](https://github.com/Philipp15b/node-jsonrpc2)
* dnode client transport using xhr-polling ?

### curl command to invoke jsonrpc service

  curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "zing", "params": [42], "id":2 }' http://localhost:3000/jsonrpc

### node client to invoke jsonrpc-service

  node client.js

### node client to invoke dnode-service (local-only)
  