

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
    half:  true
   }
  $('.voteresult').raty(resultOpts);
  
  // just sort the divs...
  function reorderResults(){
    ids=[];
    $('.resultholder .starblock').each(function(){
      ids.push($(this).prop('id'));
    });
    ids.sort();
    $rh = $('.resultholder');
    ids.forEach(function(id){
      $('#'+id).appendTo($rh);
    });
  }  
  function updateOneTally(id,tally){
    console.log('new tally for',id,tally);
    var avg = tally.sum/tally.count;
    var avg = Math.round(avg*10)/10;
    $resblock=$('#result-'+id);
    if ($resblock.length===0){
      $resblock = $('<div id="result-'+id+'" class="starblock" />');
      $resblock.append($('<label />').text(id));
      $resblock.append($('<div class="voteresult" />'));
      $('.resultholder').append($resblock);
    }
    $r=$('#result-'+id+' .voteresult');
    $r.html('');
    $r.raty($.extend({},resultOpts,{start:avg}));
    reorderResults();
  };
  DNode({
    log:function(msg){
      console.log('msg from server',msg);
      $('#log').text(msg);
    },
    update:updateOneTally
  }).connect({reconnect:5000},function (remote) {
    app.svc=remote; // global!
    app.svc.getTally(function(err,tally){
      console.log('tally',tally);
      for (id in tally){
        updateOneTally(id,tally[id]);
      }
    });
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


