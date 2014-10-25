var rs,ls,ts,bs,nextAttack;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];

$('document').ready(function(){
  $("#audio").bind('ended', function(){
    setTimeout(function(){$('.nowplaying').remove()},200);
 
});
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
  var zIndex = 100;
  // event toggle userlist in chat
  var users = document.getElementById('users')
  var usertime = new Hammer(users);
  var toggleUsers = true
  usertime.on('tap', function(event) {
    
    toggleUserlist(document.getElementById('chat_user_list').offsetHeight);

  });
  function toggleUserlist(boxheight){
    var boxHieght = boxheight
    if(toggleUsers) {
      $(".chat_user_list").hide();
      $('.peerUsername').hide();
      toggleUsers = false;
    } else {
      $(".chat_user_list").show();
      $('.peerUsername').show();
      toggleUsers = true;
    }
  }
  // media player
/*  $('#audio').mediaelementplayer({ audioWidth: splitWidth['width']-2});*/
  //login
  $('#username-text').on('keyup', function(){
    var isValid = /^[a-zA-Z0-9]+$/
    var data = $(this).val();
    var dataLength = data.split('').length;

    if ((!data.match(isValid)) || (dataLength > 16)) {
      $('#username-text').css("box-shadow", "inset 0 0 5px red");
    } else {
      $('#username-text').css("box-shadow", "none");
    }
  })

  $('#roomname-text').on('keyup', function(){
    var isValid = /^[a-zA-Z0-9]+$/
    var data = $(this).val();

    if (data.match(isValid)){
      $('#roomname-text').css("box-shadow", "none");
    } else {
      $('#roomname-text').css("box-shadow", "inset 0 0 5px red");
    }
  })

  $('#peerSubmit').on('click', function(){
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
    $('#login-box').hide();
  });
  //select chat for hammertime tap events
  var chatBox = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  chatBox.css( splitHieght ).css( fullHeight ).css( placeRight );
  var chatWindow = new Hammer(chatElement);
  set_drags(chatElement,chatBox);
  attack_grid(chatBox,"rs")
  chatBox.hide();
  //select filebox for hammertime tap events
  var fileBox = $('#file_box');
  var fileElement = document.getElementById('file_box');
  var fileWindow = new Hammer(fileElement);
  set_drags(fileElement,fileBox);
  attack_grid(fileBox,"ls")
  fileBox.hide();
  //select cambox for hammertime tap events
  var camBox = $('#cam_box');
  var camElement = document.getElementById('cam_box');
  var camWindow = new Hammer(camElement);
  set_drags(camElement,camBox);
  camBox.hide();
  //attack_grid(camBox,'ls');
  //select mediabox for hammertime tap events
  var mediaBox = $('#media_box');
  var mediaElement = document.getElementById('media_box');
  var mediaWindow = new Hammer(mediaElement);
  set_drags(mediaElement,mediaBox);
  attack_grid(mediaBox,"ls")
  mediaBox.hide();
  //set content click handler to change z-index
  $('.content').on('click',function(){
    zIndex++;
    $(this).parent().css({zIndex:zIndex});
  });
  
  //drag the chat
  function set_drags(element,jElement){
    jElement.pep({
      'constrainTo': '#desktop',
      'droppable': '.droppable',
      'useCSSTranslation': false,
      'cssEaseDuration': 200,
      'elementsWithInteraction': '.content',
      'velocityMultiplier': 0.8,
      initiate: function() {
        $('.droppable').detach();
        zIndex++;
        console.log(element.id);
        jElement.css( { zIndex: zIndex } );


        
        if( element.id == "chat_box" ){
          
          toggleUsers = !toggleUsers;
          toggleUserlist({'height':get_viewpoint()[1]*2/3});
        }
      },
      'start':function(){
        jElement.css({'height':get_viewpoint()[1]*2/3}).css( {width: get_viewpoint()[0]/2} );
        jElement.addClass('dragging_box');
        setTimeout(function(){
          $('<div/>',{id:'rs',class:'droppable'}).prependTo('body');
          $('<div/>',{id:'ls',class:'droppable'}).prependTo('body');
          $('<div/>',{id:'bs',class:'droppable'}).prependTo('body');
          
        },300);
        // left side is dragged from snap
          if (horizontalGrid[0]==jElement){
            horizontalGrid[0] = null
            if ( ls != null){
              ls.css( fullHeight ).css( placeTop );
              horizontalGrid[0] = ls;
              ls = null;
            } else {
              if( rs != null && horizontalGrid[1] !=null ){
                attack_grid(rs,'ls');
                horizontalGrid[1].css( fullHeight ).css( placeTop );
                rs = null;
              } 
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
            if ( rs != null){
              rs.css( fullHeight ).css( placeTop );
              horizontalGrid[1] = rs;
              rs = null;
            } else {
              if ( ls != null && horizontalGrid[0] != null ){
                nextAttack = ls;
                ls = null;
                attack_grid(nextAttack,'rs');
                horizontalGrid[0].css( fullHeight ).css( placeTop);
                
              }
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
        //if (element.offsetTop === 0 ) { ts = false }
        //if (element.offsetTop + element.offsetHeight == get_viewpoint()[1] && element.clientWidth+10 === get_viewpoint()[0]) { bs = false }

      },
      'rest':function(){
        if(timeout == false){
        if(this.activeDropRegions[0][0].id){var dropRegion = this.activeDropRegions[0][0].id};
        if (dropRegion.length > 0){
          if( dropRegion === "rs" ){ attack_grid(jElement,"rs") }
          else if( dropRegion ==="ls" ){ attack_grid(jElement,"ls") }
          else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") }  
         // else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") } 
         // else if (dropRegion==="ts"){ attack_grid(jElement,"ts") }
        }}
      },
      'easing':function(){
        var dropRegion = this.activeDropRegions[0][0].id;
        var dropCount = this.activeDropRegions.length;
        if (dropRegion.length == 1){
          jElement.css({"z-index":1})
          jElement.removeClass('dragging_box')
  /*        if(dropRegion === "rs"){
            jElement.css(splitWidth).css( placeRight );
          } else if (dropRegion==="ls"){
            jElement.css(splitWidth).css( placeLeft );
          } else if (dropRegion==="bs"){
            jElement.css(splitHieght);
          } else if (dropRegion==="ts"){
            jElement.css(splitHieght);
          }*/
        }
      }
    });
  }
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
//needs heavy refactoring!!! very naive and wet * 3
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
          rs.css( splitHieght ).css( placeBottom ).css( placeRight );
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
      case "bs":{
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
          jElement.css(placeBottom).css(placeLeft).css(fullWidth);
          debugger;
          bs=jElement;
        }
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
        zIndex = 100;

        $('.dragging_box').css(splitWidth);
        if(horizontalGrid[0] && ls == null){
          horizontalGrid[0].css( fullHeight ).css( splitWidth).css( placeLeft ).css( placeTop );
        } else { 
          horizontalGrid[0].css( splitHieght ).css( splitWidth).css( placeLeft ).css( placeTop );
          ls.css( splitHieght ).css( splitWidth).css( placeLeft ).css( placeBottom );
        }
        if(horizontalGrid[1] && rs == null){
          horizontalGrid[1].css( fullHeight ).css( splitWidth).css( placeRight ).css( placeTop );
        } else { 
          horizontalGrid[1].css( splitHieght ).css( splitWidth).css( placeRight ).css( placeTop );
          rs.css( splitHieght ).css( splitWidth).css( placeRight ).css( placeBottom );
        }
    }               
}

//find user viewpoint
function get_viewpoint(){
  console.log("whats the height?");
  var vpw = $(window).width();
  var vph = $(window).height();
  console.log(vph);
  console.log("whats the width");
  console.log(vpw);
  var viewpointz = [vpw,vph];
  return viewpointz;
}

