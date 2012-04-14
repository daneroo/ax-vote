

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
  
  function showInvalid($el,valid){
      if(!valid) {
          valid=false;
          $el.css('border-color','red');
          $el.css('border-width','3px');
      } else {
          $el.css('border-color','');
      }
  }
  function validateNonempty($input){
      var value=$.trim($input.val());
      var valid = value.length!=0;
      showInvalid($input,valid)
      return valid;
  }
  function validateSelect($select){
      var value=$select.val();
      var valid= value!=0;
      showInvalid($select.parent(),valid)
      return valid;
  }
  function validateThenVote(){
      var valid=true;
      var answers={labels:{}};
      $('.quest-q').each(function(){
          var $this=$(this);
          var q=$this.data('quest-q')
          var value=$this.val();
          var label=q;
          // validation
          if ($this.is('select')){
              valid = validateSelect($this) && valid;
              value = Number(value);
              label = $this.find('option:selected').text();
          } else if ($this.is('input[type=text]')) {
              valid = validateNonempty($this) && valid;
              value=$.trim(value);
              label=q;
          }
          answers[q]=value;
          answers.labels[q]=label;
      });
      
      console.log('name',name,'answers',JSON.stringify(answers),'valid',valid);

      if (valid){
          $('.grevote').addClass('ui-disabled').attr('disabled','disabled').find('.ui-btn-text').text('Merci!');
          $('.greunvote').show();
          
          return false;
          if (1) { //if (Math.random()<.5){
            // by json
            $.getJSON("/vote",answers,function(tally){
              console.log('json-tally',tally);
              //displayLatest(tally);
            });
          } else {
            // by dnode
            app.svc.vote(answers,null,function(err,tally){
              console.log('dnode-tally',tally);
              // displayLatest(tally);
            });      
          }
      }

      return false;

      // the actual post
      $.each([1,2,3],function(i,v){
      });
  }
  function unVote(){
      $('.greunvote').hide();
      $('.grevote').removeClass('ui-disabled').attr('disabled','').find('.ui-btn-text').text('Votez!');
      // now post the unvote
      return false;
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


