$('document').ready(function (){
  var zIndex = 100;
 // $("#chatbox").css({ Height: 200, width:630,'z-index':zIndex  });
 // $("#peerlist").css({ minHeight: 100, width:300,'z-index':zIndex });

 // $('#chatbox').pep({constrainTo: 'window',disableSelect:'false',elementsWithInteraction:'#username-text',shouldPreventDefault:'false'}); 
 // $('#peerlist').pep({constrainTo: 'window'}); 


$('.window').pep({
    elementsWithInteraction: '.contentwindow',
    initiate: function(){ 
        zIndex ++;
        $(this).css({ zIndex: zIndex });
                }
});
$('input').on('click',function(){
 $( this ).focus();
});
  
  });

