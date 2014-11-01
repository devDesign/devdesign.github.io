var rs,ls,ts,bs,maxWindow,nextAttack,backdoor;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];
var vidBox;
var height,width,barHeight,splitWidth,splitHeight,placeTop,placeBottom,placeRight,placeLeft,fullHeight,fullWidth;
$('document').ready(function(){

  var viewpoint = get_viewpoint();
  var height = viewpoint[1];
  var width = viewpoint[0];
  var barHeight = document.getElementById('nav').offsetHeight;
  var zIndex = 100;

  $('#file_list').hide();
  $('#big_files_box').hide();
  $('#stop-video-feed').hide();

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
    chatBox.show();
    fileBox.show();
    mediaBox.show();
    camBox.show();
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
      chatBox.show();
      fileBox.show();
      mediaBox.show();
     /* camBox.show();*/
      $('#login-box').hide();
      connectToPeer();
      get_viewpoint();
      refreshGrid();
    }
  });

  // file system tabs
  $('#downloads').on('click',function(){
    $('#my_files').removeClass('file_menu-active');
    $('#bigfiles').removeClass('file_menu-active');
    $(this).addClass('file_menu-active');
    $('#file_list').hide();
    $('#big_files_box').hide();
    $('#download_list_box').show();
  });
  $('#my_files').on('click',function(){
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

  // maximize window
  $(".maximize").on("click",function(){
    $('.maximize').hide();
    setTimeout(function(){$('.minimize').show()},200);
    get_viewpoint();
    thisWindow = $( this ).parent().parent();
    maxWindow = $(thisWindow);
    $(thisWindow).css({"z-index":9999}).css(fullWidth).css(fullHeight).css(placeLeft).css(placeTop);
  });
  // minimize
  $(".minimize").on("click",function(){
    $('.minimize').hide();
    setTimeout(function(){$('.maximize').show()},200);
    get_viewpoint();
    thisWindow = $( this ).parent().parent();
    maxWindow = null
    $(thisWindow).css({"z-index":100});
    retreatGrid($(thisWindow));
    attack_grid($(thisWindow),backdoor);
  });
  // close window
  $(".close").on("click",function(){
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

  //ultimate hammer focus on tap
  var inputfield = document.getElementsByTagName('*');
  [].slice.call(inputfield).forEach(function(element) {
    var hammertime = new Hammer(element);
    hammertime.on('tap', function(event) {
      $(element).focus();
      get_viewpoint();
      refreshGrid();
    });
  });

  // chatBox WINDOW
  var chatBox = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  chatBox.css(splitHeight).css(fullHeight).css(placeRight);
  var chatWindow = new Hammer(chatElement);
  setDrags(chatElement, chatBox);
  attack_grid(chatBox, "rs")
  chatBox.hide();
  // fileBox WINDOW
  var fileBox = $('#file_box');
  var fileElement = document.getElementById('file_box');
  var fileWindow = new Hammer(fileElement);
  setDrags(fileElement, fileBox);
  attack_grid(fileBox, "ls")
  fileBox.hide();
  // camBox WINDOW
  var camBox = $('#cam_box');
  var camElement = document.getElementById('cam_box');
  var camWindow = new Hammer(camElement);
  camBox.pep({
    constrainTo:'#desktop',
  });
  vidBox = camBox;
  camBox.detach();
  // picBox WINDOW
  var picBox = $('#pic_box');
  var picElement = document.getElementById('pic_box');
  var picWindow = new Hammer(picElement);
  picBox.pep();
  imgBox = picBox;
  picBox.detach();
  // mediaBox WINDOW
  var mediaBox = $('#media_box');
  var mediaElement = document.getElementById('media_box');
  var mediaWindow = new Hammer(mediaElement);
  setDrags(mediaElement, mediaBox);
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
  function setDrags(element, jElement) {
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
        jElement.css({
          zIndex: zIndex
        });
      },
      'start':function(){
        get_viewpoint();
        delayDropzones();
        retreatGrid(jElement);
        maxWindow = null;
        $('.minimize').hide();
        $('.maximize').show();
        jElement.css({'height':get_viewpoint()[1]*2/3}).css( {width: get_viewpoint()[0]/2} );
        jElement.addClass('dragging_box');
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
        } else if (element.offsetLeft > get_viewpoint()[1]-100){
          attack_grid(jElement,"rbs")
        } else{
        attack_grid(jElement,"bs");
        }
      }},
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
});

function retreatGrid(jElement){
  // left side is dragged from snap
  if (horizontalGrid[0][0].id==jElement[0].id){
    horizontalGrid[0] = null
    backdoor = "ls";
    if ( ls != null && bs == null){
      ls.css( fullHeight ).css( placeTop );
      horizontalGrid[0] = ls;
      ls = null;
      backdoor = "lbs";
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
    } else if (ls){
      if(ls[0].id == jElement[0].id){
        ls = null
        backdoor = "ls";
        if (horizontalGrid[0] != null){
        horizontalGrid[0].css( fullHeight ).css( placeTop );
        }
      }
  }
// right side is dragged from snap
  if (horizontalGrid[1][0].id ==jElement[0].id){
    horizontalGrid[1] = null
    backdoor = "rs"
    if ( rs != null && bs == null){
      rs.css( fullHeight ).css( placeTop );
      horizontalGrid[1] = rs;
      rs = null;
      backdoor = "rbs";
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
  } else if(rs){
    if(rs[0].id == jElement[0].id){
      rs = null;
      backdoor = "rs"
      if ( horizontalGrid[1] != null){
        horizontalGrid[1].css( fullHeight ).css(placeTop);
      }
    } 
  } else if(bs){
    if(bs[0].id == jElement[0].id){
      bs = null;
      backdoor = "bs";
      horizontalGrid[0].css(fullHeight).css(placeLeft).css(placeTop);
      horizontalGrid[1].css(fullHeight).css(placeRight).css(placeTop);
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
      //if only 1 window is snapped right do this
        if ( horizontalGrid[1] != null && rs == null && bs == null){
          horizontalGrid[1].css( splitHeight ).css( placeBottom ).css( placeRight );
          rs = jElement;
          rs.css( splitHeight ).css( placeTop ).css( placeRight ).css(splitWidth);
          break;
        } 
      // if 2 windows are snapped right do this
        else if ( horizontalGrid[1] != null && rs != null && bs == null ){
          jElement.css( splitHeight ).css( placeTop ).css( placeRight ).css(splitWidth);
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
            horizontalGrid[1].css(splitHeight).css(placeTop).css(placeLeft); horizontalGrid[0] = horizontalGrid[1]; 
            bs.css( splitWidth).css( placeBottom ).css(placeLeft);
            ls = bs;
            bs = null;
          }
          // theres a window on left so it should split hieght bottom should split width and move left
          else if( horizontalGrid[0]){ 
            horizontalGrid[0].css(splitHeight).css(placeTop).css(placeLeft);
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
            horizontalGrid[1].css( splitHeight ).css( placeBottom );
            if ( verticalGrid[1] != null ){
              horizontalGrid[0] = jElement;
              verticalGrid[1].css( splitWidth ).css( placeLeft );
              horizontalGrid[0].css( splitHeight ).css( placeTop ).css( placeLeft ).css(splitWidth);
              break;
            }  
          } 
        }
        if ( verticalGrid[1] != null ){
          verticalGrid[1].css( splitWidth ).css( placeRight );
          if ( horizontalGrid[1] != null ){
            horizontalGrid[1].css( splitHeight ).css( placeTop )
            if ( verticalGrid[0] != null ){
              horizontalGrid[0] = jElement;
              verticalGrid[0].css( splitWidth ).css( placeRight )
              horizontalGrid[0].css( splitHeight ).css( placeTop).css( placeRight );
              break; 
            }
          }
        }
        if ( horizontalGrid[0] != null && ls == null ){
          horizontalGrid[0].css( splitHeight ).css( placeBottom ).css( placeLeft );
          ls = jElement;
          ls.css( splitHeight ).css( placeTop ).css( placeLeft ).css(splitWidth);
          break;
        } else if ( horizontalGrid[0] != null && ls != null ){
          jElement.css( splitHeight ).css( placeTop ).css( placeLeft );
          ls.css( splitHeight ).css( placeBottom ).css( placeLeft );
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
            horizontalGrid[0].css( splitHeight ).css( placeTop ).css( placeLeft );            
          } else if (horizontalGrid[1]){
            horizontalGrid[1].css( splitHeight ).css( placeTop ).css( placeLeft);
          }
          bs.css(splitHeight).css(placeRight).css(placeTop).css(splitWidth);
          bs = jElement;
          bs.css(splitHeight).css(fullWidth).css(placeBottom).css(placeLeft);
          break;
        } else {
          horizontalGrid[0].css(splitHeight).css(placeLeft).css(placeTop);
          horizontalGrid[1].css(splitHeight).css(placeRight).css(placeTop);
          jElement.css(splitHeight).css(placeBottom).css(placeLeft).css(fullWidth);
          bs=jElement;
          break;
        }
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
    zIndex = 100;
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
