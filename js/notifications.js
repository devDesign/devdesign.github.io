var newDataNotification
var torrentNotification = 0;
var fileNotification= 0;
var songNotification = 0;
var imageNotification = 0;
var chatNotification = 0;
var userNotification = 0;
$(document).ready(function(){
  newDataNotification = function(label,menuElement,notificationElement,notificationNumber){
    var nElement = $('#'+notificationElement);
    var mElement = $(menuElement);

    if(mElement[0].className != "content file_menu-active"){

      notificationNumber++
      if(nElement[0]){
        nElement.html(notificationNumber)
      } else {
        $('<span/>',{id:notificationElement,class:"data_notification"}).html(notificationNumber).appendTo(menuElement);
      }

      switch (label)
      {
        case 'chat':
        chatNotification = notificationNumber;
        case 'torrentz':
        torrentNotification = notificationNumber;
        case 'file':
        fileNotification = notificationNumber;
        case 'image':
        imageNotification = notificationNumber;
        case 'user':
        userNotification = notificationNumber;
      }
    }
  }
});