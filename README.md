# branch gala-reconnaissance-estrie

This branch is to support the Gala Reconnaissance Estrie live event:

## TODO
* Ouverture/fermeture
* Selection des gagnats

## Initial deployment to cloudfoundry
When it's up, you can find it [here](http://ax-vote.cloudfoundry.com)

    # if not yet created... (add mongo later)
    vmc push eko-gre

    # to push an update
    vmc update eko-gre



## Transport 
* json-rpc  : skype(skype.html), and vote(index.html) use this
* must test CORS for json-rpc
* dnode: admin uses this

## json-rpc test

    curl -H "Content-Type: application/json" -d '{ "jsonrpc": "2.0", "method": "count", "params": ["mycounter",1], "id":2 }' http://localhost:3000/jsonrpc
