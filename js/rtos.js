var eachActiveConnection;
// THANKS to github.com/peers 
var sessionTorrents = [];
var connectToPeer;
var connectedPeers;
var openStreams = [];
var torrentValidation = [];
var peer;

$(document).ready(function() {

  function pastelColors(){
    var r = (Math.round(Math.random()* 127) + 127).toString(16);
    var g = (Math.round(Math.random()* 127) + 127).toString(16);
    var b = (Math.round(Math.random()* 127) + 127).toString(16);
    return '#' + r + g + b;
  }
  var color = pastelColors();
 
  connectedPeers = {};

  var sessionMessages = [];

  var isRoomLoaded = false;
  // get room from path!


  var uriPath = window.location.hash.split('#')[1]
  $('#roomname-text').val(uriPath || "")

var peerReconnecting = false;
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
    if (peerReconnecting) {
      // Don't rehook to download server on peerJS restart
    } else {
      startDownloadServer(peerName, roomName)
    }
    // Create PeerJS connection
    peer = new Peer(peerName, {
      host: 'allthetime.io',
      port: 9000,
      path: '/myapp',
    });

    initUser(roomName);
    errorMessage('connected!')
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
      call.on('close',function(){
        console.log("FUCK");
      });
      call.on('stream', function(remoteStream) {
        $('<video id="v' + call.peer + 'cam" class="mousecam">').appendTo('#' + call.peer + 'mouse');
        var v = document.querySelector("#v" + call.peer + "cam");
        v.src = window.URL.createObjectURL(remoteStream);
        v.play();
        if($('#mute'+call.peer) || $('#unmute'+call.peer)){
          $('#mute'+call.peer).remove();
          $('#unmute'+call.peer).remove();
        }
        $('<span class="mute_button" id="mute'+call.peer+'">&#xf028;</span>').prependTo('#'+call.peer);
        $('<span class="mute_button" id="unmute'+call.peer+'">&#xf026;</span>').prependTo('#'+call.peer);
        $('#unmute'+call.peer).hide();
        $('#mute'+call.peer).on('click',function(){
          $(this).hide();
          $('#unmute'+call.peer).show();
          $('#v' + call.peer + 'cam').prop('muted', true);  
        });
        $('#unmute'+call.peer).on('click',function(){
          $(this).hide();
          $('#mute'+call.peer).show();
          $('#v' + call.peer + 'cam').prop('muted', false);  
        });
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
      $('#pid').text(id);
      if (peerReconnecting){
        // do nothing
      } else {
        createVideoFeedButton();
      }
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
      createChannel({label: 'mouse', reliable: false}, requestedPeer)
      // Open chat channel
      createChannel({label: 'chat'}, requestedPeer)
      // Pass room history (chat and torrents) to new user
      createChannel({label:"loadRoom", reliable: true }, requestedPeer);
      // Open torrent info sending channel
      createChannel({label: 'torrentz'}, requestedPeer)   
      // Open video stream channel
      createChannel({label: 'videoFeed', reliable: false }, requestedPeer)
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
          $('#start-video-feed').hide();
          $('#stop-video-feed').show()
            .on('click',function(){
              $('#start-video-feed').show();
              $('#stop-video-feed').hide();
              stream.stop();
              eachActiveConnection(function(c,$c){
                if(c.label==='videoFeed'){
                  c.send("close");
                }
              });
              
            });

          eachActiveConnection(function(c, $c) {
            if (c.label === 'videoFeed') {
              var call = peer.call(c.peer, stream);
              openStreams.push(c.peer);
              console.log("call:"+call);
              console.log("c.peer:"+c.peer)
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

      if ( peerReconnecting ){
        // do nothing
      } else {
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

          if ( torrentList.length > 0 ){          

          }

          torrentList.forEach(function(torrent,index){
            var torrentValid = true
            torrentValidation.forEach(function(validInfoHash,index){
              if(validInfoHash==torrent["infoHash"]){
                torrentValid = false;
              }
            })
            if(torrentValid == true){
              newDataNotification("torrentz");
              torrentValidation.push(torrent["infoHash"]);
              loadPushedTorrents(torrent["infoHash"],torrent["name"],torrent["length"],torrent["size"],torrent["fileList"],c.peer)
            }
          });
        });
      }
    // Handle a chat connection.
    } else if (c.label === 'chat') {
      var chatbox = $('<div class="peerUsername"></div>').addClass('connection').addClass('active').attr('id', c.peer);
      var header = $('<div></div>').html(c.peer).appendTo(chatbox);
      var messages = $('<div><em>'+c.peer+' connected.</em></div>').addClass('messages');

      chatbox.append(header);
      globalChat.append(messages);

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

      // Fade peer out on close and destroy users torrents
      c.on('close', function() {
        $('#' + c.peer + 'mouse').fadeOut(1000, function() {
          $(this).remove();
        });
        chatbox.remove();
        if ($('.connection').length === 0) {
          $('.filler').show();
        }
        var messages = $('<div><em>'+c.peer+' disconnected.</em></div>').addClass('messages');
        globalChat.append(messages);
        // remove disconnecting users torrents
        if ( peerReconnecting ){
          // do nothing
        } else {
         /* $('.'+c.peer+'torrentz').remove();*/
        }

        // $.ajax({
        //   type: 'delete',
        //   url: 'http://allthetime.io/rtos/rooms?userName=' + c.peer,
        //   async: false
        // });        
        delete peer.connections[c.peer]
        delete connectedPeers[c.peer];
      });

    // when info hash is received!  
    } else if (c.label === 'torrentz') {

      c.on('data', function(data) {
        newDataNotification(c.label);
        loadPushedTorrents(data[0],data[1],data[2],data[3],data[4],c.peer);
      });

    // Send mouse position of moving mouse to user
    } else if (c.label === 'mouse') {

      $('<div id="' + c.peer + 'mouse" class="mouse">').appendTo('body');
      
      c.on('data', function(data) {
        var id = '#' + c.peer + 'mouse';
        $(id).css({
          "top": data[1] + "px",
          "left": data[0] + "px"
        });
      });

    // Start Video 
    } else if (c.label === "videoFeed") {
      c.on('data', function(data) {
        if(data != "close"){
          var call = peer.call(data, mediaStream);
          console.log("here comes some video");
        } else{
          $('#v' + c.peer + 'cam').detach();
        }  
      });
    }

    connectedPeers[c.peer] = 1;
  }




  // Event handlers that open and close connections
/*
  // Close a connection.
  $('#close').click(function() {
    eachActiveConnection(function(c) {
      c.close();
    });
  });*/

  $('#reconnect-to-peers').on('click', function(){
    errorMessage("reconnecting... hold on!");
    setTimeout(function(){
      peerReconnecting = true;
      peer.destroy();
      eachActiveConnection(function(c) {
        // delete peer.connections[c.peer]
        // delete connectedPeers[c.peer];
        c.close();
      });
      peer.connections = {}
      connectedPeers = {}
      connectToPeer();
    },1000);
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

    if (msg.indexOf("www") != -1){
      $('#global_chat').append('<div><span class="you" style="color:'+color+'">You: </span><span><a href="' + msg + '" target=_blank>' + msg + '</a></span></div>');
    } else {
      $('#global_chat').append('<div><span class="you" style="color:'+color+'">You: </span><span>' + msg + '</span></div>');
    }

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

  function loadPushedTorrents(infoHash,fileName,numberOfFiles,torrentSize,fileList,sender){
    var newTorrentRow = $('<tr class="file-entry '+sender+'torrentz" id="'+infoHash+'">')

    var nameCol = $('<td>')
    var sizeCol = $('<td>')
    var senderCol = $('<td>')
    var statusCol = $('<td id="'+infoHash+'-progress">')

    if (numberOfFiles == 1){
      nameCol.html('<a href="javascript:void(0);" class="'+infoHash+'-torrent">'+fileName+'</a>').appendTo(newTorrentRow)
    } else {
      nameCol.html('<a href="javascript:void(0);" class="'+infoHash+'-torrent">'+numberOfFiles+' files</a>')
      var torrentContents = $('<ul class="torrent-contents">')
      var hiddenTorrentContents = $('<ul id="t'+infoHash+'-torrent-contents" class="torrent-contents">')
      hiddenTorrentContents.hide();
      fileList.forEach(function(name,index){
          var fileItem = $('<li>').text(name)
          fileItem.appendTo(hiddenTorrentContents);
      });
      if(fileList.length>1){
          var morefiles = $('<li>').html("<a id='m"+infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-show files</a>")
          morefiles.appendTo(torrentContents);
          var hidefiles = $('<li>').html("<a id='h"+infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-hide</a>")
          hidefiles.appendTo(hiddenTorrentContents);
        }
      torrentContents.appendTo(nameCol)
      hiddenTorrentContents.appendTo(nameCol)
      nameCol.appendTo(newTorrentRow);            
    }

    sizeCol.text((torrentSize/(1024*1024)).toFixed(2)+"MB").appendTo(newTorrentRow)
    senderCol.text(sender).appendTo(newTorrentRow)
    statusCol.appendTo(newTorrentRow)

    newTorrentRow.appendTo('#download_list');
     $("#m"+infoHash+"moreFiles").on('click',function(){
        $(this).hide();
        hiddenTorrentContents.show().css({'margin-top':'-1em'});
      });
      $("#h"+infoHash+"moreFiles").on('click',function(){
        $("#m"+infoHash+"moreFiles").show()
        hiddenTorrentContents.hide();
      });

    $('.'+infoHash+'-torrent').on('click', function(e){
      console.log($(this));
      download($(this)[0].className.split('-torrent')[0]);
    });  
  }

  // Show browser version
  $('#browsers').text(navigator.userAgent);

  window.onbeforeunload = function() {
    try {
      peer.destroy();
    }
    catch(err){
      console.log(err);
    }
    // KEEP FOR PRODUCTION
   // $.ajax({
   //   type: 'delete',
   //   url: 'http://allthetime.io/rtos/rooms?userName=' + peer.id,
   //   async: false
   // });
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






