var rs,ls,ts,bs,nextAttack;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];

$('document').ready(function(){
  $("#audio").bind('ended', function(){
    setTimeout(function(){$('.nowplaying').remove()},200);
 
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
  // media player
/*  $('#audio').mediaelementplayer({ audioWidth: splitWidth['width']-2});*/
  //login
  $('#username-text').on('keyup', function(){
    var isValid = /^[a-z0-9]+$/
    var data = $(this).val();

    if (data.match(isValid)){
      $('#username-text').css("box-shadow", "none");
    } else {
      $('#username-text').css("box-shadow", "inset 0 0 5px red");
    }
  })

  $('#roomname-text').on('keyup', function(){
    var isValid = /^[a-z0-9]+$/
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

    if ((($.trim(peerName)) == '') || (($.trim(roomName)) == '')) {
      return false;
    }

    chatBox.show();
    fileBox.show();
    mediaBox.show();
    $('#login_box').hide();
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
        zIndex++;
        jElement.css( { zIndex: zIndex } );

        // left side is dragged from snap
        //if (element.offsetLeft === 0) { 
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
        //}
        // right side is dragged from snap
        //if (element.offsetLeft === Math.round(get_viewpoint()[0]/2) ) { 
          if (horizontalGrid[1]==jElement){
            horizontalGrid[1] = null
            if ( rs != null){
              rs.css( fullHeight ).css( placeTop );
              horizontalGrid[1] = rs;
              rs = null;
            } else {
              if ( ls != null && horizontalGrid[0] != null ){
                attack_grid(ls,'rs');
                horizontalGrid[0].css( fullHeight ).css( placeTop);
                ls = null
              }
            }
          } else if(rs == jElement){
            rs = null;
            if ( horizontalGrid[1] != null){
              horizontalGrid[1].css( fullHeight ).css(placeTop);
            } 
          }  
        //}
        //if (element.offsetTop === 0 ) { ts = false }
        //if (element.offsetTop + element.offsetHeight == get_viewpoint()[1] && element.clientWidth+10 === get_viewpoint()[0]) { bs = false }
        jElement.css({'height':get_viewpoint()[1]*2/3}).css( {width: get_viewpoint()[0]/2} );
        jElement.addClass('dragging_box');
      },
      'rest':function(){
        if(timeout == false){
        if(this.activeDropRegions[0][0].id){var dropRegion = this.activeDropRegions[0][0].id};
        if (dropRegion.length > 0){
          if( dropRegion === "rs" ){ attack_grid(jElement,"rs") }
          else if( dropRegion ==="ls" ){ attack_grid(jElement,"ls") } 
         // else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") } 
         // else if (dropRegion==="ts"){ attack_grid(jElement,"ts") }
        }}
      },
      'easing':function(){
        var dropRegion = this.activeDropRegions[0][0].id;
        var dropCount = this.activeDropRegions.length;
        if (dropRegion.length > 0){
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
switch (side)
    {
      case "rs":
        if ( verticalGrid[0] != null ){
          verticalGrid[0].css( splitWidth ).css( placeLeft );
          verticalGrid[0].addClass('split_left')
          if ( horizontalGrid[0] != null){
            horizontalGrid[0].css( splitHieght ).css( placeBottom );
            if ( verticalGrid[1] != null ){
              horizontalGrid[1] = jElement;
              verticalGrid[1].css( splitWidth ).css( placeRight );
              horizontalGrid[1].css( splitHieght ).css( placeTop ).css( placeRight );
              break;
            }  
          } 
        }
        if ( verticalGrid[1] != null ){
          verticalGrid[1].css( splitWidth ).css( placeLeft );
          if ( horizontalGrid[0] != null ){
            horizontalGrid[0].css( splitHieght ).css( placeTop ).css( placeRight )
            if ( verticalGrid[0] != null ){
              horizontalGrid[1] = jElement;
              verticalGrid[0].css( splitWidth ).css( placeLeft )
              horizontalGrid[1].css( splitHieght ).css( placeTop);
              break; 
            }
          }
        }
        if ( horizontalGrid[1] != null && rs == null){
          horizontalGrid[1].addClass('.split_top_right');
          horizontalGrid[1].css( splitHieght ).css( placeBottom ).css( placeRight );
          rs = jElement;
          rs.addClass('.split_bottom_right')
          rs.css( splitHieght ).css( placeTop ).css( placeRight );
          break;
        } else if ( horizontalGrid[1] != null && rs != null ){
          console.log("next ATTACK!")
          jElement.css( splitHieght ).css( placeTop ).css( placeRight );
          rs.css( splitHieght ).css( placeBottom ).css( placeRight );
          nextAttack = horizontalGrid[1];
          horizontalGrid[1] = jElement;
          attack_grid(nextAttack,"ls");
          break;
        } else {
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
    }
}
var rtime = new Date(1, 1, 2000, 12,00,00);
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
        fullHeight = { 'height': height - barHeight }
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
  var vpw = $(window).width();
  var vph = $(window).height();
  var viewpoint = [vpw,vph];
  return viewpoint;
}

