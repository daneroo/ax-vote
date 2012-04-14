

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
          $.getJSON("/vote",answers,function(tally){
            console.log('json-tally',tally);
            //displayLatest(tally);
          });
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


  // $('.grevote').button('disable');
  $('.grevote').click(validateThenVote);
  $('.greunvote').click(unVote);
  $('select').change(function(){
      var $select=$(this);
      validateSelect($select);
  });
  
});

