var rs,ls,ts,bs,nextAttack;
var verticalGrid = [null,null];
var horizontalGrid = [null,null];

$('document').ready(function(){
  var viewpoint = get_viewpoint();
  var height = viewpoint[1];
  var width = viewpoint[0];
  var barHeight = document.getElementById('nav').offsetHeight;
  var splitWidth = { 'width':width/2 }
  var splitHieght = { 'height':(height-barHeight)/2 }
  var placeTop = { 'top': barHeight }
  var placeBottom = { 'top': (height-barHeight)/2 }
  var placeRight = { 'left': width/2 }
  var placeLeft = { 'left': 0 }
  var fullHeight = { 'height': height - barHeight }
  var zIndex = 100;
  //select chat for hammertime tap events
  var chatBox = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  chatBox.css( splitHieght ).css( fullHeight ).css( placeRight );
  var chatWindow = new Hammer(chatElement);
  set_drags(chatElement,chatBox);
  attack_grid(chatBox,"rs")
  //select filebox for hammertime tap events
  var fileBox = $('#file_box');
  var fileElement = document.getElementById('file_box');
  var fileWindow = new Hammer(fileElement);
  set_drags(fileElement,fileBox);
  //select cambox for hammertime tap events
  var camBox = $('#cam_box');
  var camElement = document.getElementById('cam_box');
  var camWindow = new Hammer(camElement);
  set_drags(camElement,camBox);
  //select mediabox for hammertime tap events
  var mediaBox = $('#media_box');
  var mediaElement = document.getElementById('media_box');
  var mediaWindow = new Hammer(mediaElement);
  set_drags(mediaElement,mediaBox);  
  //drag the chat
  function set_drags(element,jElement){
    jElement.pep({
      'velocityMultiplier': 0.8,
      initiate: function() {
        zIndex++;
        jElement.css( { zIndex: zIndex } );
      },
      'start':function(){
        zIndex++;
        jElement.css( { zIndex: zIndex } );
        if (element.offsetLeft === 0) { 
          if (horizontalGrid[0]==jElement){
            horizontalGrid[0] = null
            if ( ls != null){
              ls.css( fullHeight ).css( placeTop );
              horizontalGrid[0] = rs;
              ls = null;
            } 
          } else if (ls == jElement){
              horizontalGrid[0].css( fullHeight ).css( placeTop );
              ls = null 
          }

        }
        if (element.offsetLeft === Math.round(get_viewpoint()[0]/2) ) { 
          if (horizontalGrid[1]==jElement){
            horizontalGrid[1] = null
            if ( rs != null){
              rs.css( fullHeight ).css( placeTop );
              horizontalGrid[1] = rs;
              rs = null;
            } 
          } else if(rs == jElement){
              horizontalGrid[1].css( fullHeight ).css(placeTop);
              rs = null;
            }

        }
        if (element.offsetTop === 0 ) { ts = false }
        if (element.offsetTop + element.offsetHeight == get_viewpoint()[1] && element.clientWidth+10 === get_viewpoint()[0]) { bs = false }
        jElement.css({'height':get_viewpoint()[1]*2/3}).css( splitWidth );
        jElement.addClass('dragging_box');
      },
      'constrainTo': 'window',
      'droppable': '.droppable',
      'useCSSTranslation': false,
      'cssEaseDuration': 300,
      'elementsWithInteraction': '.content',
      'rest':function(){
        var dropRegion = this.activeDropRegions[0][0].id;
        if (dropRegion.length > 0){
          if( dropRegion === "rs" ){ attack_grid(jElement,"rs") }
          else if( dropRegion ==="ls" ){ attack_grid(jElement,"ls") } 
         // else if( dropRegion ==="bs" ){ attack_grid(jElement,"bs") } 
         // else if (dropRegion==="ts"){ attack_grid(jElement,"ts") }
        }

      },
      'easing':function(){
        var dropRegion = this.activeDropRegions[0][0].id;
        var dropCount = this.activeDropRegions.length;
        var viewpoint = get_viewpoint();
        var offset = jElement.offset();

        if (dropRegion.length > 0){
          jElement.css({"z-index":1})
          jElement.removeClass('dragging_box')
          if(dropRegion === "rs"){
            
            jElement.css(splitWidth).css( placeRight );
           
          } else if (dropRegion==="ls"){
            
            jElement.css(splitWidth).css( placeLeft );

          } else if (dropRegion==="bs"){
            
            jElement.css(splitHieght);
     
          } else if (dropRegion==="ts"){
            
            jElement.css(splitHieght);

          }
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
  var placeTop = { 'top': barHeight }
  var placeBottom = { 'top': (height-barHeight)/2 + barHeight }
  var placeRight = { 'left': width/2 }
  var placeLeft = { 'left': 0 }
  var fullHeight = { 'height': height - barHeight }
  
switch (side)
    {
      case "rs":
        if ( verticalGrid[0] != null ){
          verticalGrid[0].css( splitWidth ).css( placeLeft );
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
          horizontalGrid[1].css( splitHieght ).css( placeBottom ).css( placeRight );
          rs = jElement;
          rs.css( splitHieght ).css( placeTop ).css( placeRight );
          break;
        } else if ( horizontalGrid[1] != null && rs != null ){
          console.log("next ATTACK!")
          jElement.css( splitHieght ).css( placeTop ).css( placeRight );
          rs.css( splitHieght ).css( placeBottom );
          nextAttack = horizontalGrid[1];
          horizontalGrid[1] = rs;
          rs = jElement;
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
          horizontalGrid[0] = ls;
          ls = jElement;
          nextAttack.css( placeRight );
          attack_grid(nextAttack,"rs");
          break;
        } else {
          horizontalGrid[0] = jElement;
          horizontalGrid[0].css( placeLeft ).css( placeTop ).css( fullHeight );
          break;
        }
    }
}

//refresh desktop
function refresh_desktop(viewpoint){
  var height = viewpoint[1];
  var width = viewpoint[0];
  var elemental = [$('#chat_box'),$('#file_box'),$('#cam_box'),$('#media_box')];
  if (elemental[0].class != 'window dragging_box'){
    elemental[0].css({'height':height})
  }
}

//resize window event
window.addEventListener('resize', function(event){
  refresh_desktop(get_viewpoint());
}); 

//find user viewpoint
function get_viewpoint(){
  var vpw = $(window).width();
  var vph = $(window).height();
  var viewpoint = [vpw,vph];
  return viewpoint;
}

