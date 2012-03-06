(function(){

  var count=0;
  var siteName = (window.site)?window.site.name:'no-site';
  var selfUrl = findMe(); // find the base Url this script was loaded from

  console.log('selfUrl',selfUrl);
  console.log("integrated-static",++count,siteName);
  console.log('starvote len',$('.starvote').length);

  var ratyScript=selfUrl+'/js/libs/jquery.raty.min.js';
  console.log('raty script',ratyScript);
  
  $.getScript(ratyScript,setup).fail(function(){console.log('unable to load jquery.raty plugin: ',script)})

  // wait for the jquery plugin raty to be loaded first, then setup
  // TODO : we might want to do each pages decoration on jQm::pagecreate to handle dynamic regenration in preview window
  function setup(){
    // clear first
    $('.starvote').html('');      
    // init
    $('.starvote').raty({
      path:selfUrl+'/img/raty/',
      start: 3,
      click: clickVoteHandler,
      cancel:    true,
      cancelOff: 'cancel-off-big.png',
      cancelOn:  'cancel-on-big.png',
      // half:      true,
      size:      24,
      starHalf:  'star-half-big.png',
      starOff:   'star-off-big.png',
      starOn:    'star-on-big.png'
    });      

  }

  function clickVoteHandler(rating, evt) {
    // console.log('score: ' + score);
    $rating=$(this).siblings('.rating');
    $rating.text('...voting...');
    function tallyCB(tally){
      // console.log('tally',tally);
      var avg = tally.sum/tally.count;
      var avg = Math.round(avg*10)/10;
      $rating.text(avg);
    }
    vote(rating,tallyCB);
  }
  
  function vote(rating,cb){
    // json - this method requires CORS headers
    var id = site.name+'-'+$.mobile.activePage.prop('id');
    
    // CORS xhr - not using becaus won't send cookies
    // $.getJSON(selfUrl+'/vote',{id:id,rating:rating},cb); 
    // return;
    
    // These are two other methods: using jsonp, does not require CORS
    //  jsonp
    $.getJSON(selfUrl+'/vote?callback=?',{id:id,rating:rating},cb);
    return;
    
    // jsonp explicit call
    $.ajax({
      url: selfUrl+'/vote',
      dataType: 'jsonp',
      data: {id:id,rating:rating},
      success: cb
    });
  }
  
  var defaultSelfUrl='http://dirac.imetrical.com:3000'; // default value
  // finds the <script src=".../integrate.js" /> which loaded this file
  function findMe(){
    var foundUrl;
    $('script').each(function(){
      var re = /(.*)\/js\/integrate.js/i; // (.*) //new RegExp(file + '$');
      var src = $(this).prop('src');
      if (src){
        var m = src.match(re);
        console.log(m);
        if (m && m.length && m.length==2 && m[1]){
          console.log('--',m.length,m[1]);
          foundUrl =  m[1];
          return false; // breaks the loop
        }
      }
    });
    if (!foundUrl) console.log('unable to find script tag which loaded this file.');    
    return foundUrl || defaultSelfUrl;
  }
  
})();
