

function hideURLBar(){
  MBP.hideUrlBar();
}


var app = app || {};
app.svc=null;
app.endpoint='/jsonrpc';
app.questId = 'gre-predictions';

app.voterId=null;

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
  
  // called on page init, and after a failed vote...to reset state
  function registerVoter(){
    app.voterId = $.cookie('voterId');
    console.log('previous voter id',app.voterId);
    
    $('.grevote').addClass('ui-disabled').attr('disabled','disabled').find('.ui-btn-text').text('Votez!');
    $('.greunvote').hide();
    jsonRPC(app.endpoint,'registerVoter',[app.voterId,app.questId],function(json) {
      console.log('register:',JSON.stringify(json.result));
      app.voterId = json.result.voterId;      
      $.cookie('voterId',app.voterId,{ expires: 7, path: '/' });
      
      if (json.result.canVote===false){
        $('.statusMessage').text('Vote déja enregistré');
        $('.greunvote').show();        
      } else if (json.result.contestOpen===false){
        $('.statusMessage').text('Le concours est fermé');
      } else {
        $('.statusMessage').text('');
        $('.grevote').removeClass('ui-disabled').attr('disabled','').find('.ui-btn-text').text('Votez!');
      }
    });
    
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
      var answers={
        voterId:app.voterId
        // labels:{}
      };
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
          // answers.labels[q]=label;
      });

      console.log('questId',app.questId,'answers',JSON.stringify(answers),'valid',valid);

      if (valid){
          $('.grevote').addClass('ui-disabled').attr('disabled','disabled').find('.ui-btn-text').text('Merci!');
          
          jsonRPC(app.endpoint,'vote',[app.questId,answers],function(json) {
            if (json.error){
              $('.statusMessage').text(json.error.message||'Erreur lors du vote');
              registerVoter();
            } else {
              $('.statusMessage').text('Vote enregistré');
              $('.greunvote').show();
            }
          });

      }

      return false;
  }
  function unVote(){
      $('.greunvote').hide();
      $('.grevote').removeClass('ui-disabled').attr('disabled','').find('.ui-btn-text').text('Votez!');
      // now post the unvote
      return false;
  }
  
  // for random vote
  var repondants=333;
  function rndVote(){
    $('#quest-q-name').val('Répondant #'+(repondants++));
    // $('#quest-q-detail').val(Math.floor(Math.random()*2)+1);
    $('#quest-q-detail').val(Math.floor(Math.random()*2)+1).selectmenu("refresh");
    $('#quest-q-pme').val(Math.floor(Math.random()*3)+1).selectmenu("refresh");
    $('#quest-q-manufact').val(Math.floor(Math.random()*3)+1).selectmenu("refresh");
    app.voterId='rnd-'+new Date().getTime()+'-'+(10000+Math.round(Math.random()*10000));
    
    $('.grevote').click();
    return false;
  }
  $('.rndvote').click(rndVote);
  
  $(window).bind('orientationchange', orientationChange);
  orientationChange();


  // $('.grevote').button('disable');
  $('.grevote').click(validateThenVote);
  $('.greunvote').click(unVote);
  $('select').change(function(){
      var $select=$(this);
      validateSelect($select);
  });

  // $.cookie
  registerVoter();
  
});

// support functions

// jsonRPC invocation helper
var jsonRPCId=42; // jsonRPC invocation counter
function jsonRPC(endpoint,method,paramsArray,successCB){
  var data = { 
    jsonrpc: "2.0",
    method: method,
    params: paramsArray, 
    id:(++jsonRPCId) 
  };
  $.ajax({
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    url: endpoint,
    data: JSON.stringify(data),
    success: successCB
  });
}
