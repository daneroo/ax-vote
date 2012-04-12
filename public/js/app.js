

function hideURLBar(){
  MBP.hideUrlBar();
}


var app = app || {};
app.svc=null;

$(function(){
  hideURLBar();
  // allow scrolling for now
  if(0) $('html').bind('touchmove',function(e){
    e.preventDefault();
  });
  
  // orientation change
  function orientationChange(){
    MBP.viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";    
    hideURLBar();
  }
  function validateSelect($select){
      var value=$select.val();
      if(value==0) {
          valid=false;
          $select.parent().css('border-color','red');
          $select.parent().css('border-width','3px');
      } else {
          $select.parent().css('border-color','');
      }
  }
  function validateThenVote(){
      var valid=true;
      var votes=[
          $('#select-choice-1').val(),
          $('#select-choice-2').val(),
          $('#select-choice-3').val()
      ];
      var name = $.trim($('#vote-name').val());
      if(name.length==0) {
          valid=false;
          $('#vote-name').css('border-color','red');
          $('#vote-name').css('border-width','3px');
      } else {
          $('#vote-name').css('border-color','');
      }
      $.each([1,2,3],function(i,v){
          var $select=$('#select-choice-'+v);
          validateSelect($select);
      });
      console.log('name',name,'votes',votes,'valid',valid);

      if (valid){
          $('.grevote').addClass('ui-disabled').attr('disabled','disabled').find('.ui-btn-text').text('Merci!');
          $('.greunvote').show();
      }

      return false;

      // the actual post
      $.each([1,2,3],function(i,v){
          if (1) { //if (Math.random()<.5){
            // by json
            $.getJSON("/vote",{id:'vote-Q'+v,rating:votes[i]},function(tally){
              console.log('json-tally',tally);
              //displayLatest(tally);
            });
          } else {
            // by dnode
            app.svc.vote(id,rating,null,function(err,tally){
              console.log('dnode-tally',tally);
              // displayLatest(tally);
            });      
          }
      });
  }
  function unVote(){
      $('.greunvote').hide();
      $('.grevote').removeClass('ui-disabled').attr('disabled','').find('.ui-btn-text').text('Votez!');
      // now post the unvote
  }
  $(window).bind('orientationchange', orientationChange);
  orientationChange();

  console.log('starvote len',$('.starvote').length);
  
  // $('.grevote').button('disable');
  $('.grevote').click(validateThenVote);
  $('.greunvote').click(unVote);
  $('select').change(function(){
      var $select=$(this);
      validateSelect($select);
  });
  
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

  function genDepouillement(){
    var $depouillement = $('#depouillement');
    var stamp=new Date();
    for (var i=0;i<100;i++){
      stamp = new Date(stamp.getTime()+13000);
      var clock = stamp.toISOTime();
      $v = $('<li><h3>Répondant #'+(i+99001)+'</h3><p>Vote : [v1,v2,v3]</p><p class="ui-li-aside"><strong>'+clock+'</strong></p></li>');
      $depouillement.append($v);
    }
    $depouillement.listview('refresh');
  };
  genDepouillement();
});

if ( !Date.prototype.toISOTime ) {  
    ( function() {  
        function pad(number) {  
            var r = String(number);  
            if ( r.length === 1 ) {  
                r = '0' + r;  
            }  
            return r;  
        }  
        Date.prototype.toISOTime = function() {  
            return pad( this.getUTCHours() )  
                + ':' + pad( this.getUTCMinutes() )  
                + ':' + pad( this.getUTCSeconds() );
                // + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 );
        };  
    }() );  
}

function info(msg,clear){
  if(clear) $('#console').html('');
  $('#console').append('<div>'+new Date().toISOString()+' '+msg+'</div>');
}


