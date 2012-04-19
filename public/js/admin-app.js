

function hideURLBar(){
  MBP.hideUrlBar();
}


var app = app || {};
app.svc=null;
app.counters={}
app.counters={}; // counter by Name
app.answers={}; // answer arrays by questId

// specififc for GRE
var questLabels = {
  detail:["-","COOP UdeS","McDONALDS"],
  pme:["-","MOTO SUR 2 ROUES","PMC TIRE.COM","VOODOO"],
  manufact:["-","ENERKEM","PORTABLE WINCH","MAÇONNERIE CORRIVEAU"],
}
var currentWinnerSelection={
  detail:0,
  pme:0,
  manufact:0,
}

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
  
  $(window).bind('orientationchange', orientationChange);
  orientationChange();

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
  
  DNode({
    log:function(msg){
      // console.log('msg from server: ',msg);
      $('#log').text(msg);
    },
    updateCount:function(name,count){
      // console.log('got updateCount',name,count);
      app.counters[name]=count;
      $('#skypeHits').text(count);      
    },
    updateVote:function(questId,answer){
      // console.log('got updateVote',questId,answer);
      app.answers[questId] = app.answers[questId] || [];
      app.answers[questId].push(answer);
      appendVoteToListView(answer);    
      renderHistos();
      updateWinnerSelection();
    },
    updateUnvote:function(questId,voterId){
      // console.log('got updateUnvote',questId,voterId);
      var filtered = [];
      $.each(app.answers[questId],function(i,a){
        // console.log('keeping',voterId,'!=',a.voterId);
        if (voterId!=a.voterId) filtered.push(a);
      });
      // if we removed at least one
      if (app.answers[questId].length!=filtered.length){
        app.answers[questId]=filtered;
        // re-render the whole list...
        batchUpdateListView(app.answers[questId]);
        renderHistos();
        updateWinnerSelection();
      }
    },
    updateContestState:function(state){
      // console.log('updateContestState',state);
      $('#quest-active').val(state===true?1:0);
      $('#quest-active').slider('refresh');
    }
  }).connect({reconnect:5000},function (remote) {
    app.svc=remote; // global!
    app.svc.count('skype',0); // no callback, broadcast will get it
    renderHistos();
    var answerKey='gre-predictions';    
    app.svc.getAnswers(answerKey,function(err,answers){
      // console.log('got answers',answerKey,(answers.length)?answers.length:0);
      app.answers[answerKey]=answers;
      renderHistos();
      batchUpdateListView(answers);
      updateWinnerSelection();
    });
    app.svc.getContestState(function(err,state){
      // console.log('initialContestState',state);
      // $('#quest-active').slider(state===true?'enable':'disable');
      $('#quest-active').val(state===true?1:0);
      $('#quest-active').slider('refresh');
    });
  });

  function batchUpdateListView(answers){
    var $depouillement = $('#depouillement');
    $depouillement.html('');
    $.each(answers,function(i,answer){      
      appendVoteToListView(answer,true);
    });
    $depouillement.listview('refresh');
  }
  function appendVoteToListView(answer,skipRefresh){
    var $depouillement = $('#depouillement');
    var clock = answer.stamp||new Date().toISOTime();
    $v = $('<li></li>');
    $v.append($('<h3/>').text(answer.name));
    $v.append($('<p class="ui-li-aside"/>').html('<strong>'+clock+'</strong>'));
    //var labels=[answer.labels.detail||'',answer.labels.pme||'',answer.labels.manufact||'',]
    function lkup(questQ,value){return questLabels[questQ][value]||'';}
    var labels=[lkup('detail',answer.detail),lkup('pme',answer.pme),lkup('manufact',answer.manufact)];
    $v.append('<p>Vote : '+labels.join(', ')+'</p>');
    $v.append($('<p/>').text('Id:'+answer.voterId));
    
    $depouillement.prepend($v);
    if (skipRefresh!==true){
      $depouillement.listview('refresh');
    }
  }
  function r(max){
    max = max||100;
    return Math.floor(Math.random()*max);
  }
  function renderHistos(){
    var answerKey='gre-predictions';
    var answers = app.answers[answerKey];
    $('#predictionHits').text((answers && answers.length)?answers.length:0);      
    $.each(['detail','pme','manufact'],function(i,q){
      // var histo=[r(),r()];
      var histo=[0,0,0];
      if (answers){
        // console.log('render histo',answerKey,q,answers.length);
        $.each(answers,function(j,a){
          // console.log(q,a.name,a[q]);
          if (a[q] && a[q]>0 && a[q]<4){
            histo[a[q]-1]++;
          }
        })
      }
      if (q=='detail' && histo[2]==0) { // truncate detail
        histo = [histo[0],histo[1]];
      }
      updateHisto(q,histo);
    });
  }
  function updateHisto(name,distr){
    // console.log('updateHisto',name,distr);
    var max=1;
    var w=130,h=60;
    var distr=distr||[1,2,3];
    
    // find max
    $.each(distr,function(i,x){
      if (x>max) max=x;
    });
    // normalize max==100
    $.each(distr,function(i,x){
      distr[i] = Math.round(x*100/max)
    });
    
    //http://chart.googleapis.com/chart?cht=bvg&chs=130x60&chxt=y&chxl=0:|0|345&chco=4D89F9,C6D9FD&chf=bg,s,00000000&chd=t:25,100,50"
    opts = {
      cht:'bvg',
      chs:''+w+'x'+h,
      chxt:'y',
      chxl:'0:|0|'+max,
      chco:'4D89F9,C6D9FD',
      chf:'bg,s,00000000',
      chd:'t:'+distr.join(',')
    };
    var params=[];
    $.each(opts,function(k,v){
      params.push(k+'='+v)
    });
    var src = 'http://chart.googleapis.com/chart?'+params.join('&');
    $('.chart-'+name).attr('src',src)
    // console.log('chart url',src);
  }
  function updateWinnerSelection(){
    // console.log('winner selection',JSON.stringify(currentWinnerSelection));
    $.each(['detail','pme','manufact'],function(i,questQ){
      var label=questLabels[questQ][currentWinnerSelection[questQ]]||'-';
      $('#show-w-'+questQ).text(label.substring(0,5));
      eligibleHisto=[0,0,0,0];

      var answerKey='gre-predictions';
      var answers = app.answers[answerKey];
      $.each(answers,function(i,a){
        var nCorrect=0;
        $.each(['detail','pme','manufact'],function(qi,questQ){
          if (currentWinnerSelection[questQ]==a[questQ]){
            nCorrect++;
          }
        });
        eligibleHisto[nCorrect]++;        
      });
      
      $('#candidats').text(eligibleHisto.reverse().join(': '));
    })
  }

  function selectWinners(){
    // perhaps refresh first !
    var answerKey='gre-predictions';
    var answers = app.answers[answerKey];
    var winnersByCorrectPredictions=[[],[],[],[]]; // 0,1,2,3 correct prediction
    $.each(answers,function(i,a){
      var nCorrect=0;
      $.each(['detail','pme','manufact'],function(qi,questQ){
        if (currentWinnerSelection[questQ]==a[questQ]){
          nCorrect++;
        }
      });
      winnersByCorrectPredictions[nCorrect].push(a);        
    });
    // the answers have been classified by bins of correct answers
    var winnersToSelect=6;
    var winners=[];
    $.each([3,2,1,0],function(i,predictions){
      // console.log('looking for winners with',predictions,'correct predictions');
      var candidates = winnersByCorrectPredictions[predictions];
      // console.log('among',candidates.length,'candidates');
      while (candidates.length>0 && winners.length<winnersToSelect){
        var nextWinnerIndex = Math.floor(Math.random()*99991)%candidates.length;
        var winner = candidates[nextWinnerIndex];
        // remove the winning entry...
        candidates.splice(nextWinnerIndex, 1); 
        // console.log('next winner',winner);
        winner.predictions=predictions;
        winners.push(winner);
      }
    });
    // console.log(winners);
    var $winnersList = $('#selectedWinnerList');
    $winnersList.html('');
    var lastWinnerPredictions=999;
    var alternateMarkerIndex=3;
    $.each(winners,function(i,answer){
      if (i==0 || i==alternateMarkerIndex || lastWinnerPredictions!=answer.predictions ){
        var kind = (i<alternateMarkerIndex)?"Gagnants":"Alternatifs";
        $h = $('<li data-role="list-divider"/>').text(kind);
        
        $h.append($('<span class="ui-li-count" />').text(answer.predictions+' rép'));
        $winnersList.append($h);
        lastWinnerPredictions = answer.predictions;
      }
      var clock = answer.stamp||new Date().toISOTime();
      $v = $('<li></li>');
      $v.append($('<h3/>').text(answer.name));
      $v.append($('<p class="ui-li-aside"/>').html('<strong>'+clock+'</strong>'));
      //var labels=[answer.labels.detail||'',answer.labels.pme||'',answer.labels.manufact||'',]
      function lkup(questQ,value){return questLabels[questQ][value]||'';}
      var labels=[lkup('detail',answer.detail),lkup('pme',answer.pme),lkup('manufact',answer.manufact)];
      $v.append('<p>Vote : '+labels.join(', ')+'</p>');
      $v.append($('<p/>').text('Id:'+answer.voterId));

      $winnersList.append($v);
    })
    $winnersList.listview('refresh');
  }

  // Contest state
  $('#quest-active').bind( "change", function(event, ui) {
    var nustate=$(this).val();
    // console.log('setContestState',nustate);
    app.svc.setContestState(nustate==1); // no callback
  });
  // Section Gagnants
  $("input[type='radio']").bind( "change", function(event, ui) {
    var which = $(this).prop('name').substr(2); // w-detail,w-pme
    currentWinnerSelection[which]=Number($(this).prop('value'));
    updateWinnerSelection();
  });
  
  $('.selectWinners').bind("click",selectWinners)
  
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
      return pad( this.getHours() )  
      + ':' + pad( this.getMinutes() )  
      + ':' + pad( this.getSeconds() );
      // + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 );
    };  
    Date.prototype.toISOUTCTime = function() {  
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


