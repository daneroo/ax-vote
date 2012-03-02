(function(){

  var count=0;
  function initialize(){
    console.log("integrated-static",++count,(site)?site.name:'no-site',$.mobile.activePage.attr('id'));
    if (!$.mobile){
      setTimeout(initialize,1000);
      return;
    }

    // get this from the script tag we are loaded from...
    // as in http://ekomobi.com/redirect/detect.js :: findMeAndRedirect
    var selfUrl='http://dirac.imetrical.com:3000';
    var selfUrl='http://localhost:3000';

    var votingInitialized=false;
    function injectOnce(){
      if (votingInitialized) return;

      console.log('starvote len',$('.starvote').length);
      // clear first
      $('.starvote').html('');      
      // init
      $('.starvote').raty({
        path:'/raty/img/',
        start: 3,
        click: function(score, evt) {
          console.log('score: ' + score);
          // PHP
          // $.get("api/vote");

          $rating=$(this).siblings('.rating');
          $rating.text('...voting...');

          // external json
          $.getJSON(selfUrl+'/vote/mobi',{rating:score},function(tally){
            console.log('tally',tally);
            var avg = tally.sum/tally.count;
            var avg = Math.round(avg*10)/10;
            $rating.text(avg);
          });

          // external jsonp
          $.getJSON(selfUrl+'/vote/mobi?callback=?',{rating:score},function(tally){
            console.log('tally-p',tally);
          });

          $.ajax({
            url: selfUrl+'/vote/mobi',
            dataType: 'jsonp',
            data: {rating:score},
            success: function(tally){
              console.log('tally-p2',tally);
              var avg = tally.sum/tally.count;
              var avg = Math.round(avg*10)/10;
              $rating.text(avg);
            }
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
      votingInitialized=true;
    }
    // pagebeforecreate event wrap ensures, the dom is available...but this is really later than required
    injectOnce();
    $('div[data-role=page]').live('pagebeforecreate',function(event,ui){
      injectOnce();
    });
  }

  initialize();
  
})();
