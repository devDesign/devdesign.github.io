$('document').ready(function(){
   
  //select chat for hammertime tap events
  var chat_box = $('#chat_box');
  var chatElement = document.getElementById('chat_box');
  var chatWindow = new Hammer(chatElement);
  
  //drag the chat
  chatWindow.on('press', function(event) {
    chat_box.removeClass("split_left split_right split_top split_bottom");
    chat_box.addClass('dragging_box');
    chat_box.css({width:500,height:420});
    chat_box.pep({
      'constrainTo': 'window',
      'droppable': '.droppable',
      'useCSSTranslation': false,
      'elementsWithInteraction': 'input',
      'drag':function(){
          
      }
    })
  });
});

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

