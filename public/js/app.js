

function hideURLBar(){
  MBP.hideUrlBar();
}


var app = app || {};
app.svc=null;

$(function(){
  hideURLBar();
  $('html').bind('touchmove',function(e){
    e.preventDefault();
  });
  
  // orientation change
  function orientationChange(){
    MBP.viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";    
    hideURLBar();
  }
  $(window).bind('orientationchange', orientationChange);
  orientationChange();

  console.log('starvote len',$('.starvote').length);
  $('.starvote').raty({
    path:'/img/raty/',
    start: 0,
    click: function(rating, evt) {
      var id=$(this).data('vote-id')||'TheVoid'
      function displayLatest(tally){
        $('#latestvoteid').text(id);
        $('#totalvotes').text(tally.count);
        var avg = tally.sum/tally.count;
        var avg = Math.round(avg*10)/10;
        $('#avgrating').text(avg);
      }
      if (1) { //if (Math.random()<.5){
        // by json
        $.getJSON("/vote",{id:id,rating:rating},function(tally){
          console.log('json-tally',tally);
          displayLatest(tally);
        });
      } else {
        // by dnode
        app.svc.vote(id,rating,null,function(err,tally){
          console.log('dnode-tally',tally);
          displayLatest(tally);
        });      
      }
      // could do this instead
    },
    cancel:    true,
    cancelOff: 'cancel-off-big.png',
    cancelOn:  'cancel-on-big.png',
    // half:      true,
    size:      24,
    starHalf:  'star-half-big.png',
    starOff:   'star-off-big.png',
    starOn:    'star-on-big.png'
  });
  var resultOpts={
    path:'/img/raty/',
    start: 0,
    readOnly: true,
    half:  true,
    NOTiconRange: [
       { range: 2, on: 'face-a.png', off: 'face-a-off.png' },
       { range: 3, on: 'face-b.png', off: 'face-b-off.png' },
       { range: 4, on: 'face-c.png', off: 'face-c-off.png' },
       { range: 5, on: 'face-d.png', off: 'face-d-off.png' }
     ]
   }
  $('.voteresult').raty(resultOpts);      
  DNode({
    log:function(msg){
      console.log('msg from server',msg);
      $('#log').text(msg);
    },
    update:function(id,tally){
      console.log('new tally for',id,tally);
      var avg = tally.sum/tally.count;
      var avg = Math.round(avg*10)/10;
      $r=$('#result-'+id+' .voteresult');
      $r.html('');
      $r.raty($.extend({},resultOpts,{start:avg}));
    }
  }).connect({reconnect:5000},function (remote) {
    app.svc=remote; // global!
    var param=43;
    if (0) setInterval(function(){
        app.svc.zing(param,function (err,result) {
            if (err){
                console.log('remote.zing('+param+') Error: ',err);
                param=42;
            } else {
                console.log('remote.zing('+param+') = ' + result);
                param=142;            
            }
        });
    },10*1000);
  });
});

function info(msg,clear){
  if(clear) $('#console').html('');
  $('#console').append('<div>'+new Date().toISOString()+' '+msg+'</div>');
}


