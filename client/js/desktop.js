var rs,ls,ts,bs,maxWindow,nextAttack;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];

$('document').ready(function(){
  //binding for now playing on mediaplayer
  $("#audio").bind('ended', function(){
   $('.nowplaying').remove()
  });
  $("#audio").bind('play', function(e){
    $('.nowplaying').remove();
    if(nowPlaying){
      $('<div />',{class:'nowplaying',text:nowPlaying}).appendTo('#now_playing');
    }
  });

  $('#file_list').hide();

  $('#downloads').on('click',function(){
    $('#my_files').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#file_list').hide();
    $('#download_list_box').show();
  });
  $('#my_files').on('click',function(){
    $('#downloads').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#download_list_box').hide();
    $('#file_list').show();
  });

  // maximize
  $(".maximize").on("click",function(){
    var viewpoint = get_viewpoint();
    var height = viewpoint[1];
    var width = viewpoint[0];
    var barHeight = document.getElementById('nav').offsetHeight;
    var splitWidth = { 'width':width/2 }
    var splitHieght = { 'height':(height-barHeight)/2 }
    var placeTop = { 'top': 0 }
    var placeBottom = { 'top': (height-barHeight)/2  }
    var placeRight = { 'left': width/2 }
    var placeLeft = { 'left': 0 }
    var fullHeight = { 'height': height - barHeight }
    var fullWidth = { 'width': width }
    thisWindow = $( this ).parent();
    thisWindow = thisWindow.parent();
    maxWindow = $(thisWindow);
    $(thisWindow).css({"z-index":9999}).css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
  });
  $(".close").on("click",function(){
    thisWindow = $( this ).parent();
    thisWindow = thisWindow.parent();
    $(thisWindow).remove();
  });
  //clear all grid objects
  function clearGrid(object){
    verticalGrid = [null,null];
    horizontalGrid = [null,null];
    rs = null;
    ls = null;
    bs = null;

  }

  //ultimate hammer
  var inputfield = document.getElementsByTagName('*');
  [].slice.call(inputfield).forEach(function(element) {
    var hammertime = new Hammer(element);
    hammertime.on('tap', function(event) {
      $(element).focus();
    });
  });
  var viewpoint = get_viewpoint();
  var height = viewpoint[1];
  var width = viewpoint[0];
  var barHeight = document.getElementById('nav').offsetHeight;
  var splitWidth = { 'width':width/2 }
  var splitHieght = { 'height':(height-barHeight)/2 }
  var placeTop = { 'top': 0 }
  var placeBottom = { 'top': (height-barHeight)/2 }
  var placeRight = { 'left': width/2 }
  var placeLeft = { 'left': 0 }
  var fullHeight = { 'height': height - barHeight }
  var fullWidth = { 'width': width }
  var zIndex = 100;

    //login
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
    chatBox.show();
    fileBox.show();
    mediaBox.show();
   /* camBox.show();*/
    $('#login-box').hide();
  });

  //there must be a way to listen to both input fields
    $('#username-text').on('keyup', function(e) {
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
      chatBox.show();
      fileBox.show();
      mediaBox.show();
     /* camBox.show();*/
      $('#login-box').hide();
    }
  });

  $('#roomname-text').on('keyup', function(e) {
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
      chatBox.show();
      fileBox.show();
      mediaBox.show();
     /* camBox.show();*/
      $('#login-box').hide();
    }
  });
  //select chat for hammertime tap events
  var chatBox = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  chatBox.css(splitHieght).css(fullHeight).css(placeRight);
  var chatWindow = new Hammer(chatElement);
  set_drags(chatElement, chatBox);
  attack_grid(chatBox, "rs")
  chatBox.hide();
  //select filebox for hammertime tap events
  var fileBox = $('#file_box');
  var fileElement = document.getElementById('file_box');
  var fileWindow = new Hammer(fileElement);
  set_drags(fileElement, fileBox);
  attack_grid(fileBox, "ls")
  fileBox.hide();
  //select cambox for hammertime tap events
  var camBox = $('#cam_box');
  var camElement = document.getElementById('cam_box');
  var camWindow = new Hammer(camElement);
  camBox.pep({
    constrainTo:'#desktop',
  });
  camBox.hide();
  //select mediabox for hammertime tap events
  var mediaBox = $('#media_box');
  var mediaElement = document.getElementById('media_box');
  var mediaWindow = new Hammer(mediaElement);
  set_drags(mediaElement, mediaBox);
  attack_grid(mediaBox, "ls")
  mediaBox.hide();
  //set content click handler to change z-index
  $('.content').on('click', function() {
    zIndex++;
    $(this).parent().css({
      zIndex: zIndex
    });
  });
  //drag the chat
  function set_drags(element, jElement) {
    jElement.pep({
      'constrainTo': '#desktop',
      'droppable': '.droppable',
      'useCSSTranslation': false,
      'cssEaseDuration': 400,
      'elementsWithInteraction': '.content',
      'velocityMultiplier': 0.8,
      initiate: function() {
        $('.droppable').detach();
        zIndex++;
        console.log(element.id);
        jElement.css({
          zIndex: zIndex
        });
      },
      'start':function(){
        var viewpoint = get_viewpoint();
        var height = viewpoint[1];
        var width = viewpoint[0];
        var barHeight = document.getElementById('nav').offsetHeight;
        var splitWidth = { 'width':width/2 }
        var splitHieght = { 'height':(height-barHeight)/2 }
        var placeTop = { 'top': 0 }
        var placeBottom = { 'top': (height-barHeight)/2  }
        var placeRight = { 'left': width/2 }
        var placeLeft = { 'left': 0 }
        var fullHeight = { 'height': height - barHeight }
        var fullWidth = { 'width': width }
        maxWindow = null;
        jElement.css({'height':get_viewpoint()[1]*2/3}).css( {width: get_viewpoint()[0]/2} );
        jElement.addClass('dragging_box');
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
        // left side is dragged from snap
          if (horizontalGrid[0]==jElement){
            horizontalGrid[0] = null
            if ( ls != null && bs == null){
              ls.css( fullHeight ).css( placeTop );
              horizontalGrid[0] = ls;
              ls = null;
            } else if( rs != null && horizontalGrid[1] !=null && bs == null){
                attack_grid(rs,'ls');
                horizontalGrid[1].css( fullHeight ).css( placeTop );
                rs = null;
              } else if(bs){
                bs.css(placeLeft).css(fullHeight).css(placeTop).css(splitWidth);
                horizontalGrid[1].css(fullHeight).css(placeTop).css(placeRight);
                horizontalGrid[0]= bs;
                bs = null;
              }
            } else if (ls == jElement){
              ls = null
              if (horizontalGrid[0] != null){
              horizontalGrid[0].css( fullHeight ).css( placeTop );
            }
          }
        // right side is dragged from snap
          if (horizontalGrid[1]==jElement){
            horizontalGrid[1] = null
            if ( rs != null && bs == null){
              rs.css( fullHeight ).css( placeTop );
              horizontalGrid[1] = rs;
              rs = null;
            } else if ( ls != null && horizontalGrid[0] != null ){
                nextAttack = ls;
                ls = null;
                attack_grid(nextAttack,'rs');
                horizontalGrid[0].css( fullHeight ).css( placeTop);
            } else if(bs){
                bs.css(placeRight).css(fullHeight).css(placeTop).css(splitWidth);
                horizontalGrid[0].css(fullHeight).css(placeTop);
                horizontalGrid[1]= bs;
                bs = null;
              }
          } else if(rs == jElement){
            rs = null;
            if ( horizontalGrid[1] != null){
              horizontalGrid[1].css( fullHeight ).css(placeTop);
            } 
          }  else if(bs == jElement){
            bs = null;
            horizontalGrid[0].css(fullHeight).css(placeLeft).css(placeTop);
            horizontalGrid[1].css(fullHeight).css(placeRight).css(placeTop);
          }
      },
      'rest':function(){
        if(timeout == false){
        if(this.activeDropRegions[0][0].id){var dropRegion = this.activeDropRegions[0][0].id};
        if (this.activeDropRegions.length== 1){
          if( dropRegion === "rs" ){ attack_grid(jElement,"rs") }
          else if( dropRegion ==="ls" ){ attack_grid(jElement,"ls") }
          else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") }  
        }
       if (this.activeDropRegions.length >= 2){
       attack_grid(jElement,"bs")
      }}},
      'easing': function() {
        var dropRegion = this.activeDropRegions[0][0].id;
        var dropCount = this.activeDropRegions.length;
        if (dropRegion.length == 1){
          jElement.css({"z-index":1})
          jElement.removeClass('dragging_box')
        }
      }
    });
  }
  $('#user-button').bind('click touchstart', function(e) {
    e.preventDefault();
    $('#chat_user_list').toggle();
  });
});

function attack_grid(jElement,side){
  var viewpoint = get_viewpoint();
  var height = viewpoint[1];
  var width = viewpoint[0];
  var barHeight = document.getElementById('nav').offsetHeight;
  var splitWidth = { 'width':width/2 }
  var splitHieght = { 'height':(height-barHeight)/2 }
  var placeTop = { 'top': 0 }
  var placeBottom = { 'top': (height-barHeight)/2  }
  var placeRight = { 'left': width/2 }
  var placeLeft = { 'left': 0 }
  var fullHeight = { 'height': height - barHeight }
  var fullWidth = { 'width': width }

switch (side)
    {
    // user has thrown a window to right
      case "rs":
      //if only 1 window is snapped right do this
        if ( horizontalGrid[1] != null && rs == null && bs == null){
          horizontalGrid[1].css( splitHieght ).css( placeBottom ).css( placeRight );
          rs = jElement;
          rs.css( splitHieght ).css( placeTop ).css( placeRight );
          break;
        } 
      // if 2 windows are snapped right do this
        else if ( horizontalGrid[1] != null && rs != null && bs == null ){
          jElement.css( splitHieght ).css( placeTop ).css( placeRight );
          rs.css( splitHeight ).css( placeBottom ).css( placeRight );
          nextAttack = horizontalGrid[1];
          horizontalGrid[1] = jElement;
          attack_grid(nextAttack,"ls");
          break;
        } 
        // if 1 window is snapped to bottom and 1 window is snapped to right or left
        else if( (horizontalGrid[1] || horizontalGrid[0]) && rs == null && ls == null && bs){
          // theres a window on the right so it should split hieght go left and bottom should split width and move left
          if( horzontalGrid[1]){ 
            horizontalGrid[1].css(splitHieght).css(placeTop).css(placeLeft); horizontalGrid[0] = horizontalGrid[1]; 
            bs.css( splitWidth).css( placeBottom ).css(placeLeft);
            ls = bs;
            bs = null;
          }
          // theres a window on left so it should split hieght bottom should split width and move left
          else if( horizontalGrid[0]){ 
            horizontalGrid[0].css(splitHieght).css(placeTop).css(placeLeft);
            bs.css( splitWidth).css( placeBottom ).css(placeLeft);
            ls = bs;
            bs = null;
          }
          jElement.css( splitWidth ).css( placeTop ).css( fullHeight ).css( placeRight );
          horizontalGrid[1] = jElement;
          break;
        }
        else{
          horizontalGrid[1] = jElement;
          horizontalGrid[1].css( placeRight ).css( placeTop ).css( fullHeight );
          break;
        }
      case "ls":
        if ( verticalGrid[0] != null ){
          verticalGrid[0].css( splitWidth ).css( placeRight );
          if ( horizontalGrid[1] != null){
            horizontalGrid[1].css( splitHieght ).css( placeBottom );
            if ( verticalGrid[1] != null ){
              horizontalGrid[0] = jElement;
              verticalGrid[1].css( splitWidth ).css( placeLeft );
              horizontalGrid[0].css( splitHieght ).css( placeTop ).css( placeLeft );
              break;
            }  
          } 
        }
        if ( verticalGrid[1] != null ){
          verticalGrid[1].css( splitWidth ).css( placeRight );
          if ( horizontalGrid[1] != null ){
            horizontalGrid[1].css( splitHieght ).css( placeTop )
            if ( verticalGrid[0] != null ){
              horizontalGrid[0] = jElement;
              verticalGrid[0].css( splitWidth ).css( placeRight )
              horizontalGrid[0].css( splitHieght ).css( placeTop).css( placeRight );
              break; 
            }
          }
        }
        if ( horizontalGrid[0] != null && ls == null ){
          horizontalGrid[0].css( splitHieght ).css( placeBottom ).css( placeLeft );
          ls = jElement;
          ls.css( splitHieght ).css( placeTop ).css( placeLeft );
          break;
        } else if ( horizontalGrid[0] != null && ls != null ){
          jElement.css( splitHieght ).css( placeTop ).css( placeLeft );
          ls.css( splitHieght ).css( placeBottom ).css( placeLeft );
          nextAttack = horizontalGrid[0];
          horizontalGrid[0] = jElement;
          attack_grid(nextAttack,"rs");
          break;
        } else {
          horizontalGrid[0] = jElement;
          horizontalGrid[0].css( placeLeft ).css( placeTop ).css( fullHeight );
          break;
        }
      // user has thrown window to the bottom  
      case "bs":
        // if there is a window on the bottom already and a window on the left or right
        if(bs != null && (horizontalGrid[0] || horizontalGrid[1]) && ls==null && rs==null){
          console.log('what?');
          // if there is a window on the left or a window on the right they should split height 
          if(horizontalGrid[0] &&  horizontalGrid[1] == null){
            horizontalGrid[0].css( splitHieght ).css( placeTop ).css( placeLeft );            
          } else if (horizontalGrid[1]){
            horizontalGrid[1].css( splitHieght ).css( placeTop ).css( placeLeft);
          }
          bs.css(splitHieght).css(placeRight).css(placeTop).css(splitWidth);
          bs = jElement;
          bs.css(splitHieght).css(fullWidth).css(placeBottom).css(placeLeft);
          break;
        } else {
          horizontalGrid[0].css(splitHieght).css(placeLeft).css(placeTop);
          horizontalGrid[1].css(splitHieght).css(placeRight).css(placeTop);
          jElement.css(splitHieght).css(placeBottom).css(placeLeft).css(fullWidth);
          bs=jElement;
        }
      
    }
}

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
        console.log("rezise!")
        viewpoint = get_viewpoint();
        height = viewpoint[1];
        width = viewpoint[0];
        barHeight = document.getElementById('nav').offsetHeight;
        splitWidth = { 'width':width/2 }
        splitHieght = { 'height':(height-barHeight)/2 }
        placeTop = { 'top': 0 }
        placeBottom = { 'top': (height-barHeight)/2 }
        placeRight = { 'left': width/2 } 
        placeLeft = { 'left': 0 }
        fullHeight = { 'height': height - barHeight };
        fullWidth ={ 'width': width }
        zIndex = 100;

        $('.dragging_box').css(splitWidth);
        if(maxWindow){
          maxWindow.css(fullHeight).css(fullWidth).css(placeTop).css(placeLeft);
        } else{ 
          if(horizontalGrid[0] && ls == null && bs == null){
            horizontalGrid[0].css( fullHeight ).css( splitWidth).css( placeLeft ).css( placeTop );
          } else if(horizontalGrid[0] && ls) { 
            horizontalGrid[0].css( splitHieght ).css( splitWidth).css( placeLeft ).css( placeTop );
            ls.css( splitHieght ).css( splitWidth).css( placeLeft ).css( placeBottom );
          }
          if(horizontalGrid[1] && rs == null && bs == null){
            horizontalGrid[1].css( fullHeight ).css( splitWidth).css( placeRight ).css( placeTop );
          } else if(horizontalGrid[1] && rs) { 
            horizontalGrid[1].css( splitHieght ).css( splitWidth).css( placeRight ).css( placeTop );
            rs.css( splitHieght ).css( splitWidth).css( placeRight ).css( placeBottom );
          }
          if(bs){
            horizontalGrid[1].css( splitHieght ).css( splitWidth).css( placeRight ).css( placeTop );
            horizontalGrid[0].css( splitHieght ).css( splitWidth).css( placeLeft ).css( placeTop );
            bs.css( fullWidth ).css( placeBottom).css( placeLeft ).css(splitHieght);
          }
        }
    }               
}

//find user viewpoint
function get_viewpoint(){
  var vpw = $(window).width();
  var vph = $(window).height();
  console.log(vph);
  console.log(vpw);
  var viewpointz = [vpw,vph];
  return viewpointz;
}
