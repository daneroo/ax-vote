

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
    start: 3,
    click: function(score, evt) {
      console.log('score: ' + score);
      $.getJSON("/vote/thang",{rating:score},function(tally){
        console.log('tally',tally);
      });
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
    
  $('#vote').click(function(){
    console.log('click vote');
    app.svc.vote('thing',(new Date().getTime()/1000)%5,function(err,tally){
      console.log('voted',err,tally);
      if (err) {
        console.log('vote() Error: ',err);
      } else {
        $('#totalvotes').text(tally.count);
        var avg = tally.sum/tally.count;
        var avg = Math.round(avg*10)/10;
        $('#avgrating').text(avg);
      }
    });
  });
  
  DNode({
    log:function(msg){
      console.log('msg from server',msg);
      $('#log').text(msg);
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


