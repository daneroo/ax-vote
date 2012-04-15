

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
    questId = 'gre-predictions';

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

      console.log('questId',questId,'answers',JSON.stringify(answers),'valid',valid);

      if (valid){
          $('.grevote').addClass('ui-disabled').attr('disabled','disabled').find('.ui-btn-text').text('Merci!');
          $('.greunvote').show();
          
          var endpoint='/jsonrpc';
          jsonRPC(endpoint,'vote',[questId,answers],function(json) {
            console.log('vote total:',json);
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
