var eachActiveConnection;
// THANKS to github.com/peers 
var sessionTorrents = [];
var connectToPeer;

$(document).ready(function() {

  function pastelColors(){
    var r = (Math.round(Math.random()* 127) + 127).toString(16);
    var g = (Math.round(Math.random()* 127) + 127).toString(16);
    var b = (Math.round(Math.random()* 127) + 127).toString(16);
    return '#' + r + g + b;
  }
  var color = pastelColors();
  var peer;
  var connectedPeers = {};

  var sessionMessages = [];

  var isRoomLoaded = false;
  // get room from path!


  var uriPath = window.location.hash.split('#')[1]
  $('#roomname-text').val(uriPath || "")

  // Log In
  connectToPeer = function(e) {
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

    // Set uri path as #roomName
    window.location.hash = roomName;

    // Create WebRTC.io connection for HUGE files
    startDownloadServer(peerName, roomName)
    // Create PeerJS connection
    peer = new Peer(peerName, {
      host: 'allthetime.io',
      port: 9000,
      path: '/myapp',
    });

    initUser(roomName);

    // Listen for new connections
    // SEND ROOM TO NEW USER!!!!!!!!!!!!!!!!!
    // FUCK
    peer.on('connection', connect);

    peer.on('connection', function(c){
      if ( c.label === "loadRoom" ) {
        setTimeout(function(){
          c.send([sessionMessages,sessionTorrents]);
        },2000)
      }
    });

    peer.on('call', function(call) {

      call.answer();
      call.on('stream', function(remoteStream) {
        var v = document.querySelector("#v" + call.peer + "cam");
        v.src = window.URL.createObjectURL(remoteStream);
        v.play();
      });
    });
    peer.on('error', function(err) {
      console.log(err);
    })
  }

  // Add user to room and initialize functionality
  function initUser(roomname) {
    peer.on('open', function(id) {
      $('#username-text').hide();
      $('#peerSubmit').hide();
      $('#id').show();
      $('.glyph').show();
      $('#pid').text(id);
      createVideoFeedButton();
      var data = {
        roomName: roomname,
        userName: id
      }      
      sendUserToServer(data);
    });
  }

  // Sends user to API userlist
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

  // Get connected users from API and connect to them
  function getUsersInRoom(roomname) {
    var allusers = $.get("http://allthetime.io/rtos/rooms?roomName=" + roomname, function(data) {
      data["userList"].forEach(function(user) {
        connectToUser(user);
      })
    });
  }


  function createChannel(options,requestedPeer){
    var channel = peer.connect(requestedPeer, options);
    channel.on('open', function() {
      connect(channel);
    });
    channel.on('error', function(err) {       
      console.log(options.label + ": " +err);
    });
  }







  // Initialize a peer connection open necessary dataChannels and streams
  function connectToUser(requestedPeer) {
    if (!connectedPeers[requestedPeer]) {
      // Open cursor following channel
      createChannel({label: 'mouse'}, requestedPeer)
      // Open chat channel
      createChannel({label: 'chat'}, requestedPeer)
      // Pass room history (chat and torrents) to new user
      createChannel({label:"loadRoom"}, requestedPeer);
      // Open torrent hash sending channel
      createChannel({label: 'torrentz'}, requestedPeer)      
      // Open video stream channel
      createChannel({label: 'videoFeed', reliable: true }, requestedPeer)
      // Open file drop channel
      createChannel({label: 'initData', reliable: true } ,requestedPeer)
    }
    connectedPeers[requestedPeer] = 1;
  }

  // Add send video button
  function createVideoFeedButton() {
    // Send video to everyone
    $('#start-video-feed').on('click', function() {
      // Vendor specific madness
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

      navigator.getUserMedia({
          video: true,
          audio: true
        }, function(stream) {
          eachActiveConnection(function(c, $c) {
            if (c.label === 'videoFeed') {
              var call = peer.call(c.peer, stream)
            }
          })
        }, function(err) {
          console.log('videoFeed: '+err)
        });
    })
  }

  // Handle open channel between users
  function connect(c) {


    var globalChat = $('#global_chat');

    if(c.label === 'loadRoom') {

      c.on('data', function(data){

        if ( isRoomLoaded ){
          //
        } else {
          var messageList = data[0]
          messageList.forEach(function(message,index){
            globalChat.append('<div><span class="peer" style="color:'+message['color']+'">' + message['peer'] + '</span>: ' + message['message'] +
          '</div>');
            globalChat.scrollTop(globalChat.prop("scrollHeight"));
          });
          isRoomLoaded = true;
        }

        var torrentList = data[1]

        torrentList.forEach(function(torrent,index){


          var infoHash = torrent["infoHash"]
          var fileName = torrent["name"]
          var numberOfFiles = torrent["length"]


          var newTorrentDiv = $('<div class="file-entry" id="'+infoHash+'">')
        
          if (numberOfFiles == 1){
            var newTorrentFile = $('<a id="'+infoHash+'-torrent">').text(fileName);
          } else {
            var newTorrentFile = $('<a id="'+infoHash+'-torrent">').text("torrent ("+numberOfFiles+" files)");            
          }

          newTorrentFile.attr('href','javascript:void(0);');
          
          $('<span class="progress-bar" id="'+infoHash+'-progress">').text('0%').appendTo(newTorrentDiv)
          newTorrentFile.appendTo(newTorrentDiv)

          newTorrentDiv.appendTo('#filelist');

          newTorrentFile.on('click', function(e){
            download(e.target.id.split('-torrent')[0]);
          });


        });
      });

    // Handle a chat connection.
    } else if (c.label === 'chat') {
      var chatbox = $('<div class="peerUsername"></div>').addClass('connection').addClass('active').attr('id', c.peer);
      var header = $('<div></div>').html(c.peer).appendTo(chatbox);
      var messages = $('<div><em>'+c.peer+' connected.</em></div>').addClass('messages');



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
      $('#chat_user_list').append(chatbox);

      // Append message to chat
      c.on('data', function(data) {
     
        globalChat.append('<div><span class="peer" style="color:'+data[1]+'">' + c.peer + '</span>: ' + data[0] +
          '</div>');
        globalChat.scrollTop(globalChat.prop("scrollHeight"));



        var messageObject = { "peer": c.peer, "message": data[0], "color": data[1] }
        sessionMessages.push(messageObject);

      });

      // Fade peer out on close
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

    // when info hash is received!  
    } else if (c.label === 'torrentz') {

      c.on('data', function(data) {
        var infoHash = data[0]
        var fileName = data[1]

        var numberOfFiles = data[2]


          var newTorrentDiv = $('<div class="file-entry" id="'+infoHash+'">')
        
          if (numberOfFiles == 1){
            var newTorrentFile = $('<a id="'+infoHash+'-torrent">').text(fileName);
          } else {
            var newTorrentFile = $('<a id="'+infoHash+'-torrent">').text("torrent ("+numberOfFiles+" files)");            
          }

          newTorrentFile.attr('href','javascript:void(0);');
          
          $('<span class="progress-bar" id="'+infoHash+'-progress">').text('0%').appendTo(newTorrentDiv)
          newTorrentFile.appendTo(newTorrentDiv)

          newTorrentDiv.appendTo('#filelist');

          newTorrentFile.on('click', function(e){
            download(e.target.id.split('-torrent')[0]);
          });


      });

    // Send mouse position of moving mouse to user
    } else if (c.label === 'mouse') {

      $('<div id="' + c.peer + 'mouse" class="mouse">').appendTo('body');
      $('<video id="v' + c.peer + 'cam" class="mousecam">').appendTo('#' + c.peer + 'mouse');
      c.on('data', function(data) {
        var id = '#' + c.peer + 'mouse';
        $(id).css({
          "top": data[1] + "px",
          "left": data[0] + "px"
        });
      });

    // Receive filename of newly dropped file 
    } else if (c.label === 'initData') {
     /* c.on('data', function(data) {
        var sender = c.peer
          // Create link to trigger upload initialization
        $('<div/>', {
          'id': "attackData" + data.split('.')[0],
          'class': 'file',
          'text': data
        }).appendTo('#box');
        // Draggable.create(".file",{type:"x,y", edgeResistance:0.65, bounds:"#box"});

        $('#attackData' + data.split('.')[0]).pep({
          constrainTo: 'window'
        });
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
      });*/

    // DOWNLOADER RECEIVE FILE NAME FROM UPLOADER AS CONFIRMATION OF REQUEST
    } else if (c.label === "attackData") {
      c.on('data', function(data) {

        var fileSystemData = peer.connect(c.peer, {
          label: 'fileSystemData',
          reliable: true
        });
        fileSystemData.on('open', function() {
          connect(fileSystemData);
          fileName = data
          fileSize = userFiles[data].size
          fileSystemData.send([fileSize, fileName])
        });
        fileSystemData.on('error', function(err) {
          alert(err);
        });
      });

    //  RECIEVED BY DOWNLOADER -- SETS UP FILE SYSTEM  
    } else if (c.label == "fileSystemData") {
      // Receive file and begin upload  
      c.on('data', function(data) {
        fileSize = data[0]
        fileName = data[1]
        //REQUEST FILE SYSTEM
        //ON FILE SYSTEM SET UP CALL BACK SEND CONFIRMATION
        function onInitFs(fs) {
          console.log(fs, "file system created with " + fileSize)
          var systemReadyData = peer.connect(c.peer, {
            label: 'systemReadyData',
            reliable: true
          });
          systemReadyData.on('open', function() {
            connect(systemReadyData);
            systemReadyData.send(fileName)
          });
          systemReadyData.on('error', function(err) {
            console.log(err);
          });
        }

        function errorHandler(err) {
          console.log(err)
        }

        if (window.webkitRequestFileSystem) {
          window.webkitRequestFileSystem(window.TEMPORARY, fileSize + 1024, onInitFs, errorHandler);
        } else {
          window.requestFileSystem(window.TEMPORARY, data + 1024, onInitFs, errorHandler);
        }
      });

    // SYSTEM READY  -- RECEIVED BY UPLOADER AS INDICATION THAT FS IS READY FOR FILE
    } else if (c.label === "systemReadyData") {
      // SIGNAL TO UPLOADER THAT DONWLOADERS FILESYSTEM IS READ
      c.on('data', function(data) {
        var fireData = peer.connect(c.peer, {
          label: 'fireData',
          reliable: true
        });
        fireData.on('open', function() {
          console.log(fireData)
          connect(fireData);
          var file = userFiles[data]
            // Send stored file to receiver
          console.log(data + ' ready for filesystem')
          fireData.send([file, file.type, file.name]);
        });
        fireData.on('error', function(err) {
          alert(err);
        });
      });

    // FIRE DATA -- DATA BEGINS TO SEND RECEIVED BY DOWNLOADER
    } else if (c.label === "fireData") {
      //Listener transfer_progress manually added to library peer.js
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
         /* $('#global_chat').append('<div><span class="file">' +
            c.peer + ' has sent you a <a target="_blank" href="' + url + '" download="' + data[2] + '">file</a>.</span></div>');
          $('<audio/>', {
            'width': "320",
            'height': "32px",
            'class': 'mejs-player'
          }).appendTo('#global_chat');
          $('<source/>', {
            'type': filetype,
            'src': url
          }).appendTo('audio');
          $('audio').mediaelementplayer({
            success: function(media) {
              media.play();
            }
          });*/
        }
      });

    // Incoming video
    } else if (c.label === "videoFeed") {
      c.on('data', function(data) {
        var call = peer.call(data, mediaStream);
        console.log("here comes some video");
      });
    }

    connectedPeers[c.peer] = 1;
  }




  // Event handlers that open and close connections

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
    // Send filename to all users to create download link on drop
    eachActiveConnection(function(c, $c) {
      if (c.label === 'initData') {
        c.send(file.name);
      }
    });
  });

  // Send a chat message to all active connections
  $('#send').submit(function(e) {
    e.preventDefault();
    var msg = $('#text').val();

    if (msg === ''){
      return false;
    }
    
    msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var messageObject = {};
    messageObject[peer.id] = msg;
    var messageObject = { "peer": peer.id, "message": msg, "color": color }
    sessionMessages.push(messageObject);

    $('#global_chat').append('<div><span class="you" style="color:'+color+'">You: </span><span>' + msg + '</span></div>');
    $('#global_chat').scrollTop($('#global_chat').prop("scrollHeight"));
    eachActiveConnection(function(c, $c) {
      if (c.label === 'chat') {
        c.send([msg,color]);
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
  // Helper functions

  function doNothing(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Goes through each active peer and calls fn on its connections.
  eachActiveConnection = function(fn) {
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

  window.onbeforeunload = function() {
    try {
      peer.destroy();
      console.log(peer)
    }
    catch(err){
      console.log(err);
    }
    // KEEP FOR PRODUCTION
     $.ajax({
       type: 'delete',
       url: '/rtos/rooms?userName=' + peer.id,
       async: false
     });
  }
});

window.onunload = window.onbeforeunload = function(e) {
  try {
    if (!!peer && !peer.destroyed) {
    peer.destroy();
    }
  }
  catch(err) {
    console.log(err);
  }
};






