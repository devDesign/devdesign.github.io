var rs,ls,ts,bs,maxWindow,nextAttack,backdoor;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];
var vidBox;
var newDataNotification
var wall;
var height,width,barHeight,splitWidth,splitHeight,placeTop,placeBottom,placeRight,placeLeft,fullHeight,fullWidth;
var roomId="home";
var torrentNotification = 0;
var fileNotification= 0;
var songNotification = 0;
var imageNotification = 0;

$('document').ready(function(){
  var viewpoint = get_viewpoint();
  var height = viewpoint[1];
  var width = viewpoint[0];
  var barHeight = document.getElementById('nav').offsetHeight;
  var zIndex = 100;
  
  $('#download_list_box').hide();
  $('#big_files_box').hide();
  $('#stop-video-feed').hide();
  $('.glyph').show();
  $('<audio id="audioplayer" controls preload="none" type="audio/mp3" src=""></audio>').appendTo('#music-player')
  $("#playlist").tablesorter({sortList: [[0,0],[2,0],[3,0]]}); 
  $("#filelist").tablesorter({sortList: [[4,1]]});
  $("#room_info").tablesorter({sortList: [[0,0]]}); 
  wallfree();

  // login
  $('#username-text').on('keyup', function() {
    var isValid = /^[a-zA-Z0-9]+$/
    var data = $(this).val();
    var dataLength = data.split('').length;
    if ((!data.match(isValid)) || (dataLength > 16)) {
      $('#username-text').css("box-shadow", "inset 0 0 5px red");
    } else {
      $('#username-text').css("box-shadow", "none");
    }
  })

  $('#roomname-text').on('keyup', function() {
    var isValid = /^[a-zA-Z0-9]+$/
    var data = $(this).val();
    if (data.match(isValid)) {
      $('#roomname-text').css("box-shadow", "none");
    } else {
      $('#roomname-text').css("box-shadow", "inset 0 0 5px red");
    }
  })

  $('#peerSubmit').on('click', function() {
    var peerName = $('#username-text').val();
    var roomName = $('#roomname-text').val();
    var isValid = /^[a-zA-Z0-9]+$/
    var peerNameLength = peerName.split('').length;
    if ((!peerName.match(isValid)) || (!roomName.match(isValid)) || (peerNameLength > 16)) {
      return false;
    }
    if ((($.trim(peerName)) == '') || (($.trim(roomName)) == '')) {
      return false;
    }
    $('#login-box').hide();
    connectToPeer();
    get_viewpoint();
    refreshGrid();
  });

  $('.login-input').on('keyup', function(e) {
    if(e.keyCode === 13){
      var peerName = $('#username-text').val();
      var roomName = $('#roomname-text').val();
      var isValid = /^[a-zA-Z0-9]+$/
      var peerNameLength = peerName.split('').length;
      if ((!peerName.match(isValid)) || (!roomName.match(isValid)) || (peerNameLength > 16)) {
        return false;
      }
      if ((($.trim(peerName)) == '') || (($.trim(roomName)) == '')) {
        return false;
      }
      $('#login-box').hide();
      connectToPeer();
      get_viewpoint();
      refreshGrid();
    }
  });

  // file system tabs
  $('#downloads').on('click',function(){
    torrentNotification = 0;
    $('#torrentNotification').remove();
    $('#my_files').removeClass('file_menu-active');
    $('#bigfiles').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#file_list').hide();
    $('#big_files_box').hide();
    $('#download_list_box').show();
  });
  $('#my_files').on('click',function(){
    fileNotification = 0;
    $('#fileNotification').remove();
    $('#downloads').removeClass('file_menu-active');
    $('#bigfiles').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#download_list_box').hide();
    $('#big_files_box').hide();
    $('#file_list').show();
  });

  $('#bigfiles').on('click',function(){
    $('#downloads').removeClass('file_menu-active');
    $('#my_files').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#download_list_box').hide();
    $('#big_files_box').show();
    $('#file_list').hide();
  });

    // media player tabs
  $('#my_songs').on('click',function(){
    songNotification = 0;
    $('#songNotification').remove();
    $('#my_images').removeClass('file_menu-active');
    $('#my_movies').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#my_images_box').hide();
    $('#my_movies_box').hide();
    $('#music-player').show();
  });
  $('#my_images').on('click',function(){
    imageNotification = 0;
    $('#imageNotification').remove();
    $('#my_songs').removeClass('file_menu-active');
    $('#my_movies').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#music-player').hide();
    $('#my_movies_box').hide();
    $('#my_images_box').show();
  });
  $('#my_movies').on('click',function(){
    $('#my_images').removeClass('file_menu-active');
    $('#my_songs').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#my_images_box').hide();
    $('#music-player').hide();
    $('#my_movies').show();
  });

  // maximize window
  $(".maximize").on("click",function(){
    $('.maximize').hide();
    setTimeout(function(){$('.minimize').show()},200);
    get_viewpoint();
    thisWindow = $( this ).parent().parent();
    maxWindow = $(thisWindow);
    $(thisWindow).css({"z-index":2})
    fileBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
    mediaBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
    chatBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);

    wall.fitWidth();
  });
  // minimize
  $(".minimize").on("click",function(){
    $('.minimize').hide();
    setTimeout(function(){$('.maximize').show()},200);
    get_viewpoint();
    thisWindow = $( this ).parent().parent();
    maxWindow = null
    clearGrid();
    attack_grid(fileBox,"rs");
    attack_grid(chatBox,"rs");
    attack_grid(mediaBox,"rs");
    $(thisWindow).css({"z-index":1});
  });
  // close window
  $(".close").on("click touchstart",function(){
    thisWindow = $( this ).parent();
    thisWindow = thisWindow.parent();
    console.log(thisWindow);
    if(thisWindow[0].id == "cam_box" ){
      vidBox = $(thisWindow);
    }
    $(thisWindow).detach();
  });

  //clear all grid objects
  function clearGrid(object){
    verticalGrid = [null,null];
    horizontalGrid = [null,null];
    rs = null;
    ls = null;
    bs = null;
  }

/*  //ultimate hammer focus on tap
  var inputfield = document.getElementsByTagName('input');
  [].slice.call(inputfield).forEach(function(element) {
    var hammertime = new Hammer(element);
    hammertime.on('tap', function(event) {
      $(element).focus();

    });
  });
*/
  //hammertime events
  function hammertimeBox(hammertime,target){
    var zIndexx=1;
/*    hammertime.on("doubletap",function(){
    $('.maximize').hide();
    $('.minimize').show();
    get_viewpoint();
    target.css({"z-index":999})
    chatBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
    mediaBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
    fileBox.css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
    wall.fitWidth();
  })*/
  hammertime.on("press",function(){
    $('.minimize').hide();
    $('.maximize').show();
    get_viewpoint();
    retreatGrid(target);
    attack_grid(target,"bs");
  })
  hammertime.on("swiperight",function(){
    console.log("swipe");
    if(target===chatBox){
    target.css({'z-index':zIndexx--})
    mediaBox.css({'z-index':zIndexx+2})
    fileBox.css({'z-index':zIndexx++})
    }
    if(target===mediaBox){
    target.css({'z-index':zIndexx--})
    chatBox.css({'z-index':zIndexx++})
    fileBox.css({'z-index':zIndexx+2})
    }
    if(target===fileBox){
    target.css({'z-index':zIndexx--})
    mediaBox.css({'z-index':zIndexx++})
    chatBox.css({'z-index':zIndexx+2})
    }
  },100);
  hammertime.on("swipeleft",function(){
    console.log("swipe");
    if(target===chatBox){
    target.css({'z-index':zIndexx--})
    mediaBox.css({'z-index':zIndexx++})
    fileBox.css({'z-index':zIndexx+2})
    }
    if(target===mediaBox){
    target.css({'z-index':zIndexx--})
    chatBox.css({'z-index':zIndexx+2})
    fileBox.css({'z-index':zIndexx++})
    }
    if(target===fileBox){
    target.css({'z-index':zIndexx--})
    mediaBox.css({'z-index':zIndexx+2})
    chatBox.css({'z-index':zIndexx++})
    }

  })
  }

  // chatBox WINDOW
  var chatBox = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  chatBox.css(splitHeight).css(fullHeight).css(placeRight);
  var chatWindow = new Hammer(chatElement);
  setDrags(chatElement, chatBox);

  hammertimeBox(chatWindow,chatBox);
  // fileBox WINDOW
  var fileBox = $('#file_box');
  var fileElement = document.getElementById('file_box');
  var fileWindow = new Hammer(fileElement);
  setDrags(fileElement, fileBox);
  hammertimeBox(fileWindow,fileBox);
  // camBox WINDOW
  var camBox = $('#cam_box');
  var camElement = document.getElementById('cam_box');
  var camWindow = new Hammer(camElement);
  camBox.pep({
    constrainTo:'#desktop',
    'elementsWithInteraction': '.close'
  });
  vidBox = camBox;
  camBox.detach();
  // picBox WINDOW
  var picBox = $('#pic_box');
  var picElement = document.getElementById('pic_box');
  var picWindow = new Hammer(picElement);
  picBox.pep({'elementsWithInteraction': '.close'});
  imgBox = picBox;
  picBox.detach();
  // mediaBox WINDOW
  var mediaBox = $('#media_box');
  var mediaElement = document.getElementById('media_box');
  var mediaWindow = new Hammer(mediaElement);
  setDrags(mediaElement, mediaBox);
  hammertimeBox(mediaWindow,mediaBox);

  attack_grid(fileBox, "rs")
  attack_grid(mediaBox, "rs")
  attack_grid(chatBox, "rs")


  function onTop(jElement){
    jElement.css({"z-index":2})
    if(jElement != chatBox){chatBox.css({"z-index":1})}
    if(jElement != mediaBox){mediaBox.css({"z-index":1})}
    if(jElement != fileBox){fileBox.css({"z-index":1})}
  }
  

  //drag the chat
  function setDrags(element, jElement) {
    jElement.pep({
      'constrainTo': '#desktop',
      'droppable': '.droppable',
      'useCSSTranslation': false,
      'cssEaseDuration': 300,
      'elementsWithInteraction': '.content',
      'velocityMultiplier': 2.0,
      initiate: function() {
        $('.droppable').detach();
        
      },
      'start':function(){
        jElement.addClass('dragging_box')
        get_viewpoint();
        delayDropzones();
        retreatGrid(jElement);
        maxWindow = null;
        $('.minimize').hide();
        $('.maximize').show();
        jElement.css({'height':get_viewpoint()[1]*1/4}).css( {width: get_viewpoint()[0]/2} );
   
      },
      'rest':function(){  
        if (this.activeDropRegions.length== 1){
          var dropRegion = this.activeDropRegions[0][0].id
          if( dropRegion === "rs" ){ attack_grid(jElement,"rs") }
          else if( dropRegion ==="ls" ){ attack_grid(jElement,"ls") }
          else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") }  
        }
         if (this.activeDropRegions.length >= 2){
          if (element.offsetLeft<100){
            attack_grid(jElement,"lbs")
          } else if (element.offsetLeft > get_viewpoint()[1]/1.5){
            attack_grid(jElement,"rbs")
          } else{
          attack_grid(jElement,"bs");
          }
        }
        jElement.removeClass('dragging_box');
      },
      'easing': function() {
        //var dropRegion = this.activeDropRegions[0][0].id;
        var dropCount = this.activeDropRegions.length;
        if (dropCount >= 1){
          jElement.removeClass('dragging_box')
        }
      }
    });
  }

  $('#user-button').bind('click touchstart', function(e) {
    e.preventDefault();
    $('#chat_user_list').toggle();
  });

  newDataNotification = function(label){
    if(label=="torrentz"){
      if($('#downloads')[0].className != "content file_menu-active"){
        torrentNotification++
        if($('#torrentNotification')[0]){
          $('#torrentNotification').html(torrentNotification)
        } else {
          $('<span/>',{id:'torrentNotification',class:"data_notification"}).html(torrentNotification).appendTo('#downloads');
        }
      }
    }
    if(label=="file"){
      if($('#my_files')[0].className != "content file_menu-active"){
        fileNotification++
        if($('#fileNotification')[0]){
          $('#fileNotification').html(fileNotification)
        } else {
          $('<span/>',{id:'fileNotification',class:"data_notification"}).html(fileNotification).appendTo('#my_files');
        }
      }
    }
    if(label=="image"){
      if($('#my_images')[0].className != "content file_menu-active"){
        imageNotification++
        if($('#imageNotification')[0]){
          $('#imageNotification').html(imageNotification)
        } else {
          $('<span/>',{id:'imageNotification',class:"data_notification"}).html(imageNotification).appendTo('#my_images');
        }
      }
    }
    if(label=="song"){
      if($('#my_songs')[0].className != "content file_menu-active"){
        songNotification++
        if($('#songNotification')[0]){
          $('#songNotification').html(songNotification)
        } else {
          $('<span/>',{id:'songNotification',class:"data_notification"}).html(songNotification).appendTo('#my_songs');
        }
      }
    }
  }

});

function retreatGrid(jElement){
  // left side is dragged from snap
  if (horizontalGrid[0][0].id==jElement[0].id){
    horizontalGrid[0] = null
    backdoor = "ls";
    if (ls){
      ls.css( fullHeight ).css( placeTop ).css(splitWidth);
      horizontalGrid[0] = ls;
      ls = null;
      backdoor = "lbs";
    }
    if( rs && horizontalGrid[1]){
        attack_grid(rs,'ls');
        horizontalGrid[1].css( fullHeight ).css( placeTop ).css(splitWidth);
        rs = null;
      } 
    if(bs){
        bs.css(placeLeft).css(fullHeight).css(placeTop).css(splitWidth);
        horizontalGrid[1].css(fullHeight).css(placeTop).css(splitWidth).css(placeRight);
        horizontalGrid[0]= bs;
        bs = null;
      }
    }
    if (ls){
      if(ls[0].id == jElement[0].id){
        ls = null
        backdoor = "ls";
        horizontalGrid[0].css( fullHeight ).css( placeTop ).css(splitWidth);
      }
  }
// right side is dragged from snap
  if (horizontalGrid[1][0].id ==jElement[0].id){
    horizontalGrid[1] = null
    backdoor = "rs"
    if (rs){
      rs.css( fullHeight ).css( placeTop ).css(splitWidth);
      horizontalGrid[1] = rs;
      rs = null;
      backdoor = "rbs";
    }
    if ( ls && horizontalGrid[0]){
        attack_grid(ls,'rs');
        ls = null;
        horizontalGrid[0].css( fullHeight ).css( placeTop).css(splitWidth);
    }
    if(bs){
        bs.css(placeRight).css(fullHeight).css(placeTop).css(splitWidth);
        horizontalGrid[0].css(fullHeight).css(placeTop).css(splitWidth);
        horizontalGrid[1]= bs;
        bs = null;
      }
  }
  if(rs){
    if(rs[0].id == jElement[0].id){
      rs = null;
      backdoor = "rs"
      if ( horizontalGrid[1]){
        horizontalGrid[1].css( fullHeight ).css(placeTop).css(splitWidth);
      }
    } 
  } 
  if(bs){
    if(bs[0].id == jElement[0].id){
      bs = null;
      backdoor = "bs";
      horizontalGrid[0].css(fullHeight).css(placeLeft).css(placeTop).css(splitWidth);
      horizontalGrid[1].css(fullHeight).css(placeRight).css(placeTop).css(splitWidth);
    }
  } 
}

function delayDropzones(){
  setTimeout(function() {
    $('<div/>', {
      id: 'rs',
      class: 'droppable'
    }).prependTo('body');
    $('<div/>', {
      id: 'ls',
      class: 'droppable'
    }).prependTo('body');
    $('<div/>', {
      id: 'bs',
      class: 'droppable'
    }).prependTo('body');
  }, 300);
}

function attack_grid(jElement,side){
  get_viewpoint();

switch (side)
    {
    // user has thrown a window to right
      case "rs":
      if(horizontalGrid[0]){
        horizontalGrid[0].css(splitHeight).css(placeBottom).css(splitWidth).css(placeLeft);
        ls = horizontalGrid[0];
      }
      if(horizontalGrid[1]){
        horizontalGrid[1].css(splitHeight).css(placeTop).css(splitWidth).css(placeLeft);
        horizontalGrid[0] = horizontalGrid[1];
      }
        horizontalGrid[1]=jElement;
        horizontalGrid[1].css(fullHeight).css(splitWidth).css(placeRight).css(placeTop)
        break;
      case "ls":
      if(horizontalGrid[1]){
        horizontalGrid[1].css(splitHeight).css(placeBottom).css(splitWidth).css(placeRight);
        rs = horizontalGrid[1];
      }
      if(horizontalGrid[0]){
        horizontalGrid[0].css(splitHeight).css(placeTop).css(splitWidth).css(placeRight);
        horizontalGrid[1] = horizontalGrid[0];
      }
        horizontalGrid[0]=jElement;
        horizontalGrid[0].css(fullHeight).css(splitWidth).css(placeLeft).css(placeTop)
        break;
      case "bs":
        if(jElement==$('#media_box')){
          $('#my_images_list').css(fullWidth);
          wall.fitWidth();
        }
        horizontalGrid[0].css(splitHeight).css(placeLeft).css(placeTop).css(splitWidth);
        horizontalGrid[1].css(splitHeight).css(placeRight).css(placeTop).css(splitWidth);
        jElement.css(splitHeight).css(placeBottom).css(placeLeft).css(fullWidth);
        bs=jElement;
        break;
      case "lbs":
        horizontalGrid[0].css(splitHeight).css(placeTop).css(splitWidth).css(placeLeft);
        ls = horizontalGrid[0];
        horizontalGrid[0]=jElement;
        horizontalGrid[0].css(splitHeight).css(splitWidth).css(placeLeft).css(placeBottom)
        break;
      case "rbs":
        horizontalGrid[1].css(splitHeight).css(placeTop).css(splitWidth).css(placeRight);
        rs = horizontalGrid[1];
        horizontalGrid[1]=jElement;
        horizontalGrid[1].css(splitHeight).css(splitWidth).css(placeRight).css(placeBottom)
        break;
    }
  
}
// focus resize
$("input[type=text], textarea").on({ 'touchstart' : function() {
    zoomDisable();
}});
$("input[type=text], textarea").on({ 'touchend' : function() {
    setTimeout(zoomEnable, 500);
}});

function zoomDisable(){
  $('head meta[name=viewport]').remove();
  $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0" />');
}
function zoomEnable(){
  $('head meta[name=viewport]').remove();
  $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=1" />');
} 
// resize init date
var rtime = new Date(23, 4, 1985, 12,00,00);
var timeout = false;
var delta = 300;

$(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeend, delta);
    }
});

function resizeend() {
  if (new Date() - rtime < delta) {
    setTimeout(resizeend, delta);
  } else {
    timeout = false;
    get_viewpoint();
    refreshGrid();
  }               
}

//refresh the grid
function refreshGrid(){
 $('.dragging_box').css(splitWidth);
  if(horizontalGrid[0] && ls == null && bs == null){
    horizontalGrid[0].css( fullHeight ).css( splitWidth).css( placeLeft ).css( placeTop );
  } else if(horizontalGrid[0] && ls) { 
    horizontalGrid[0].css( splitHeight ).css( splitWidth).css( placeLeft ).css( placeBottom );
    ls.css( splitHeight ).css( splitWidth).css( placeLeft ).css( placeTop );
  }
  if(horizontalGrid[1] && rs == null && bs == null){
    horizontalGrid[1].css( fullHeight ).css( splitWidth).css( placeRight ).css( placeTop );
  } else if(horizontalGrid[1] && rs) { 
    horizontalGrid[1].css( splitHeight ).css( splitWidth).css( placeRight ).css( placeBottom );
    rs.css( splitHeight ).css( splitWidth).css( placeRight ).css( placeTop );
  }
  if(bs){
    horizontalGrid[1].css( splitHeight ).css( splitWidth).css( placeRight ).css( placeTop );
    horizontalGrid[0].css( splitHeight ).css( splitWidth).css( placeLeft ).css( placeTop );
    bs.css( fullWidth ).css( placeBottom).css( placeLeft ).css(splitHeight);
  }
  if(maxWindow){
    maxWindow.css(fullHeight).css(fullWidth).css(placeTop).css(placeLeft);
  }
  wall.fitWidth(); 
}

//find user viewpoint
function get_viewpoint(){
  var vpw = $(window).width();
  var vph = $(window).height();
  height = vph;
  width = vpw;
  barHeight = document.getElementById('nav').offsetHeight;
  splitWidth = { 'width':width/2 }
  splitHeight = { 'height':(height-barHeight)/2 }
  placeTop = { 'top': 0 }
  placeBottom = { 'top': (height-barHeight)/2 }
  placeRight = { 'left': width/2 } 
  placeLeft = { 'left': 0 }
  fullHeight = { 'height': height - barHeight };
  fullWidth ={ 'width': width }
  var viewpointz = [vpw,vph];
  return viewpointz;
}

function wallfree(){
  wall = new freewall("#my_images_list");
  wall.reset({
    selector: 'img',
    animate: false,
    delay: 10,
    onResize: function() {
      wall.fitWidth();
    }
  });
  wall.fitWidth();
}
    