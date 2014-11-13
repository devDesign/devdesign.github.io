var totalOnline
var totalRooms
$('document').ready(function(){
  var allrooms = $.get("http://allthetime.io/rtos/rooms", function(data) {
    totalRooms = Object.keys(data).length
    Object.keys(data).forEach(function (key) {
      var roomNameCol = $('<td>');
      var usersCol = $('<td>');
      var roomRow = $('<tr>'); 
      $('<div/>',{class:'room_name',id:key,text:key}).appendTo(roomNameCol);
      $('<div/>',{class:'room_name',text:data[key].length}).appendTo(usersCol);
      roomNameCol.appendTo(roomRow);
      usersCol.appendTo(roomRow);
      roomRow.appendTo('#room_info-tbody');
      $("#room_info").trigger('addRows',[roomRow,true]); 
      $('#'+key).on('click',function(){
        var roomname = $(this).text()
        $('#roomname-text').val(roomname);
        $('#username-text').focus();
      })
    })  
  });

});