// THANKS to github.com/peers 
$(document).ready(function() {


//
//
//       SET       UP  
//
//


  var peer;
  var connectedPeers = {};
  // Create connection
  $('#peerSubmit').on('click', function(e) {
    var peerName = $('#username-text').val();
    var roomName = $('#roomname-text').val();
   // if (e.keyCode === 13) {
      console.log(peerName);
  //    peer = new Peer(peerName, {
  //      host: 'allthetime.io',
  //      port: 9000,
  //      path: '/myapp'
  //    });
  //

      startDownloadServer(peerName,roomName)


      
      peer = new Peer(peerName, {
          host: 'allthetime.io',
          port: 9000,
          path: '/myapp',
        //    config: {'iceServers': [
        //   { 
         //      url: 'turn:104.131.149.75:3478', 
         //      credential: 'test',
         //      username: 'user'
        //        url: 'turn:numb.viagenie.ca',
        //        username: 'chronic88@gmail.com',
         //       password: 'giraffE33'
        //   
        //   }
      //   ]} 
      });

      showID(roomName);

      // Await connections from others
      peer.on('connection', connect);
      peer.on('call',function(call){
        call.answer();
        console.log(call);
       $('#v'+call.peer+'cam').append({'text':call.peer});
      call.on('stream',function(remoteStream){
        console.log("remote");
        var v = document.querySelector("#v"+ call.peer + "cam");
        v.src = window.URL.createObjectURL(remoteStream);
        v.play();

        console.log(remoteStream);
      });
      console.log('i have recived a call');
      });      
      peer.on('error', function(err) {
        console.log(err);
      })
   // }
  });

  // shows username
  function showID(roomname) {
    peer.on('open', function(id) {
      $('#username-text').hide();
      $('#peerSubmit').hide();
      $('#pid').text(id);
      var data = {
        roomName: roomname,
        userName: id
      }
      createVideoFeedButton();
      sendUserToServer(data);
    });
  }

  // sends username to Node server
  function sendUserToServer(userinfo) {
    $.ajax({
      url: 'http://allthetime.io/rtos/rooms',
      type: 'post',
      data: JSON.stringify(userinfo),
      success: function() {
        getUsersInRoom(userinfo.roomName)
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        console.log('error', errorThrown);

      }
    });
  }

  // get all connected users and connect
  function getUsersInRoom(roomname) {
    var allusers = $.get("http://allthetime.io/rtos/rooms?roomName=" + roomname, function(data) {
      data["userList"].forEach(function(user) {
        connectToUser(user);
      })
    });
  }

  // connect to a newly connected user
  function connectToUser(userId) {
    var requestedPeer = userId;
    if (!connectedPeers[requestedPeer]) {
      
      var m = peer.connect(requestedPeer, {
        label: 'mouse'
      });
      m.on('open', function() {
        connect(m);
      });
      m.on('error', function(err) { //alert(err);
      })
      // Create connections
      
      var c = peer.connect(requestedPeer, {
        label: 'chat',
        serialization: 'none',
        metadata: {
          message: 'hi i want to chat with you!'
        }
      });
      c.on('open', function() {
        connect(c);
      });
      c.on('error', function(err) {
        alert(err);
      });
      var videoFeed = peer.connect(requestedPeer,{
        label: 'videoFeed',reliable:true
      });
      videoFeed.on('open',function(){
        connect(videoFeed);
        console.log("video feed data established");
      
      });
    
      var initData = peer.connect(requestedPeer, {
        label: 'initData',
        reliable: true
      });
      initData.on('open', function() {
        connect(initData);
      });
      initData.on('error', function(err) {
        alert(err);
      });
    }
    connectedPeers[requestedPeer] = 1;
  }

  //call all active connections for video feed
function createVideoFeedButton(){
  $('<button/>',{text:'start video feed',id:'start_video_feed-button'}).appendTo('#username-div'); 
  $('button').on('click',function(){
 
   // var navigator.getUserMedia = ( navigator.getUserMedia ||
                      //        navigator.mozGetUserMedia ||
                     //         navigator.webkitGetUserMedia ||  
                    //          navigator.msGetUserMedia);

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;


    navigator.getUserMedia({video:true,audio:true},function(stream){
    eachActiveConnection(function(c,$c){
      if (c.label==='videoFeed'){
    var call = peer.call(c.peer,stream)}
    })
    },function(err){}
 
    ) })}

//
//
//       RECEIVE    LOGIC
//
//



  // Handle a connection object.
  function connect(c) {

    // Handle a chat connection.
    if (c.label === 'chat') {
      var globalChat = $('#global_chat');
      var chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', c.peer);
      var header = $('<h1></h1>').html('Chat with <strong>' + c.peer + '</strong>');
      var messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
      chatbox.append(header);
      globalChat.append(messages);

      // Select connection handler.
      chatbox.on('click', function() {
        if ($(this).attr('class').indexOf('active') === -1) {
          $(this).addClass('active');
        } else {
          $(this).removeClass('active');
        }
      });
      $('.filler').hide();
      $('#peerlist').append(chatbox);

      c.on('data', function(data) {
        globalChat.append('<div><span class="peer">' + c.peer + '</span>: ' + data +
          '</div>');
      });
      c.on('close', function() {
        $('#' + c.peer + 'mouse').fadeOut(1000, function() {
          $(this).remove();
        });
        chatbox.remove();
        if ($('.connection').length === 0) {
          $('.filler').show();
        }
        delete connectedPeers[c.peer];
      });
    
    // Receive filename of newly dropped file 
    } else if (c.label === 'initData') {
      c.on('data', function(data) {
        var sender = c.peer
        // Create link to trigger upload initialization
        $('<div/>',{ 'id':"attackData"+data.split('.')[0],'class':'file','text':data }).appendTo('#box');
       // Draggable.create(".file",{type:"x,y", edgeResistance:0.65, bounds:"#box"});
       
      $('#attackData'+data.split('.')[0]).pep({constrainTo: 'window'}); 
      $('#global_chat').append('<div><span class="file">' +
          c.peer + ' has dropped file: <a href="#" id="attackData' + data.split('.')[0] + '">' + data + '</a>');
      
      
    
      
      
      
      // Create connection to send file name back to sender to initialze upload on click
        $('#attackData' + data.split('.')[0]).on('dblclick doubletap', function(e) {

          var attackData = peer.connect(sender, {
            label: 'attackData',
            reliable: true
          });
          attackData.on('open', function() {
            console.log(attackData)
            connect(attackData);
            // Send file name to sender 
            attackData.send(data)
          });
          attackData.on('error', function(err) {
            alert(err);
          });


        });
      });

    // Send mouse position of moving mouse to user
    } else if (c.label === 'mouse') {
      $('<div id="' + c.peer + 'mouse" class="mouse">').appendTo('body');
      $('<video id="v'+ c.peer + 'cam" class="mousecam">').appendTo('#'+c.peer+'mouse');
      c.on('data', function(data) {
        var id = '#' + c.peer + 'mouse';
        $(id).css({
          "top": data[1] + "px",
          "left": data[0] + "px"
        });
      });


    // DOWNLOADER RECEIVE FILE NAME FROM UPLOADER AS CONFIRMATION OF REQUEST


    } else if (c.label === "attackData") {
      c.on('data', function(data) {

        var fileSystemData = peer.connect(c.peer, {
          label: 'fileSystemData',
          reliable: true
        });
        fileSystemData.on('open', function(){
          connect(fileSystemData);
          fileName = data
          fileSize = userFiles[data].size
          fileSystemData.send([fileSize,fileName])
        });
        fileSystemData.on('error', function(err) {
          alert(err);
        });
      });




    ///  RECIEVED BY DOWNLOADER -- SETS UP FILE SYSTEM  

    } else if (c.label == "fileSystemData") {
    // Receive file and begin upload  
      c.on('data', function(data){ 
        fileSize = data[0]
        fileName = data[1]
        //REQUEST FILE SYSTEM
        //ON FILE SYSTEM SET UP CALL BACK SEND CONFIRMATION
        function onInitFs(fs){
          console.log(fs,"file system created with "+fileSize)
          var systemReadyData = peer.connect(c.peer, {
            label: 'systemReadyData',
            reliable: true
          });
          systemReadyData.on('open', function(){
            connect(systemReadyData);
            systemReadyData.send(fileName)
          });
          systemReadyData.on('error', function(err) {
            alert(err);
          });
        }
        function errorHandler(err){
          console.log(err)
        }

        if (window.webkitRequestFileSystem) {
          window.webkitRequestFileSystem(window.TEMPORARY, fileSize + 1024, onInitFs,errorHandler);
        } 
         else {
          window.requestFileSystem(window.TEMPORARY, data + 1024, onInitFs, errorHandler);
        }

      });



    ////// SYSTEM READY  -- RECEIVED BY UPLOADER AS INDICATION THAT FS IS READY FOR FILE

    } else if (c.label === "systemReadyData"){
      // SIGNAL TO UPLOADER THAT DONWLOADERS FILESYSTEM IS READ
      c.on('data', function(data){
        var fireData = peer.connect(c.peer, {
          label: 'fireData',
          reliable: true
        });
        fireData.on('open', function() {
          console.log(fireData)
          connect(fireData);
          var file = userFiles[data]
          // Send stored file to receiver
          console.log(data+' ready for filesystem')
          fireData.send([file, file.type, file.name]);
        });
        fireData.on('error', function(err) {
          alert(err);
        });
      });




      /////// FIRE DATA -- DATA BEGINS TO SEND RECEIVED BY DOWNLOADER

    } else if (c.label === "fireData") {
      //Listener transfer_progress manually added to library peer.js @ // FUCK
      c.on('transfer_progress', function(s) {
        console.log(s);
      });

      // Fired on completion
      c.on('data', function(data) {
        var file = data[0];
        var filetype = data[1];
        console.log(filetype);
        // If we're getting a file, create a URL for it.
        if (file.constructor === ArrayBuffer) {
          var dataView = new Uint8Array(file);
          // Set filetype of blob based on uploaded file type
          var dataBlob = new Blob([dataView], {
            type: filetype
          });
          var url = window.URL.createObjectURL(dataBlob);
          // Create download link 
          $('#global_chat').append('<div><span class="file">' +
            c.peer + ' has sent you a <a target="_blank" href="' + url + '" download="' + data[2] + '">file</a>.</span></div>');
          $('<audio/>',{'width':"320",'height':"32px",'class':'mejs-player'}).appendTo('#global_chat');
          $('<source/>',{'type':filetype,'src':url}).appendTo('audio');
          $('audio').mediaelementplayer({success:function(media){
            media.play();
          }});
        }
      });


    // VIDEVIDEVIDEO

    }else if (c.label === "videoFeed"){
      c.on('data',function(data){
        var call = peer.call(data,mediaStream);
        console.log(call);
        console.log("video feeeeeeeeed");
      });
  
  }

    connectedPeers[c.peer] = 1;
  }


//
//
//     CONNECTION ALTERING ACTIONS
//
//

  // Close a connection.
  $('#close').click(function() {
    eachActiveConnection(function(c) {
      c.close();
    });
  });

  // Temporary storage of file links for uploader 
  var userFiles = {};

  // File drop
  var box = $('#box');
  box.on('dragenter', doNothing);
  box.on('dragover', doNothing);
  box.on('drop', function(e) {
    e.originalEvent.preventDefault();
    var file = e.originalEvent.dataTransfer.files[0];
    userFiles[file.name] = file
    $('#global_chat').append('<div><span class="file">You dropped ' + file.name + '.</span></div>');
    // Send filename to all users to create download link
    eachActiveConnection(function(c, $c) {
      if (c.label === 'initData') {
        c.send(file.name);
      }
    });
  });

  // Send a chat message to all active connections.
  $('#send').submit(function(e) {
    e.preventDefault();
    var msg = $('#text').val();
    $('#global_chat').append('<div><span class="you">You: </span>' + msg + '</div>');
    eachActiveConnection(function(c, $c) {
      if (c.label === 'chat') {
        c.send(msg);
      }
    });
    $('#text').val('');
    $('#text').focus();
  });

  // Watch mouse move and send to all users
  $(document).on('mousemove', function(e) {
    var x = e.clientX;
    var y = e.clientY;
    eachActiveConnection(function(c, $c) {
      if (c.label === 'mouse') {
        c.send([x, y]);
      }
    });
  });

//
//
//          HELPERS
//
//

  function doNothing(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Goes through each active peer and calls FN on its connections.
  function eachActiveConnection(fn) {
    var actives = $('.active');
    var checkedIds = {};
    actives.each(function() {
      var peerId = $(this).attr('id');

      if (!checkedIds[peerId]) {
        var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
          var conn = conns[i];
          fn(conn, $(this));
        }
      }

      checkedIds[peerId] = 1;
    });
  }

  // Show browser version
  $('#browsers').text(navigator.userAgent);
});

// Destroy peer upon quit or window close
window.onunload = window.onbeforeunload = function(e) {
  if (!!peer && !peer.destroyed) {
    peer.destroy();
  }
};
