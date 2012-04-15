

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
      console.log('msg from server: ',msg);
      $('#log').text(msg);
    },
    updateCount:function(name,count){
      console.log('got updateCount',name,count);    
      $('#skypeHits').text(count);      
    },
    updateVote:function(questId,answer){
      console.log('got updateVote',questId,answer);
      appendVoteToListView(answer);    
      randHistos();
    }
  }).connect({reconnect:5000},function (remote) {
    app.svc=remote; // global!
    app.svc.count('skype',0); // no callback, broadcast will get it
    randHistos();
  });

  function appendVoteToListView(answer){
    var $depouillement = $('#depouillement');
    var stamp=new Date();
    var clock = stamp.toISOTime();
    // $v = $('<li><h3>Répondant #'+(i+99001)+'</h3><p>Vote : [v1,v2,v3]</p><p class="ui-li-aside"><strong>'+clock+'</strong></p></li>');
    $v = $('<li></li>');
    $v.append($('<h3/>').text(answer.name));
    $v.append($('<p class="ui-li-aside"/>').html('<strong>'+clock+'</strong>'));
    $depouillement.append($v);
    $depouillement.listview('refresh');
  }
  function r(max){
    max = max||100;
    return Math.floor(Math.random()*max);
  }
  function randHistos(){
    updateHisto('detail',[r(),r()]);
    updateHisto('pme',[r(),r(),r()]);
    updateHisto('manufact',[r(),r(),r()]);
  }
  function updateHisto(name,distr){
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
    console.log('chart url',src);
  }
  function genDepouillement(){
    var $depouillement = $('#depouillement');
    var stamp=new Date();
    for (var i=0;i<2;i++){
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


