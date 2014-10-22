
/***************
	ROOM INIT & functionality
	
	Copyright 2013 Samuel Erb

	This file is part of webRTCCopy.

	webRTCCopy is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	webRTCCopy is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with webRTCCopy.  If not, see <http://www.gnu.org/licenses/>.

	http://www.tldrlegal.com/license/gnu-general-public-license-v3-(gpl-3)
	
****************/

var ROOM_TITLE = "WebRTC Copy - Room "; /* constant - room title bar string */

/* your username */
var username = "";

/* server name */
// var rtccopy_server = "wss:rtccopy.com:8001"; /* 8001 for secure, 8000 for insecure */
var rtccopy_server = "ws:allthetime.io:8000";  
//var rtccopy_server = "ws:localhost:8000";

/* intro function */
// initRTCCopy();


function display_error() {
	/* REQUIRED SCTP data channels behind flag in 29 & 30 */
	if ($.browser.name == "chrome" && ($.browser.versionNumber == 29 || $.browser.versionNumber == 30)) {
		boot_alert('You are using Chrome version ' + $.browser.versionNumber + ', please turn the "Enable SCTP Data Channels" flag in: chrome://flags/#enable-sctp-data-channels');
	} else {
		if ($.browser.name == "chrome") {
			boot_alert('Your browser is not supported. Please update to the latest version of Chrome to use this site. Please try Firefox 24+ or Chrome Canary 32+.');
		}else if ($.browser.name == "firefox") {
			boot_alert('Your browser is not supported. Please update to Firefox 24+.');
		}else {
			boot_alert('Your browser is not supported. Please use Chrome or Firefox, sorry :(');
		}
	}
}

/* intro function */
// function initRTCCopy() {
	
// 	if ($.browser.name != "chrome" && $.browser.name != "firefox") {
// 		$(".support").show();
// 	}

// 	/* initial create room/username logic */
//   var roomInput = $("#existing") 

// 	var r = window.location.hash.slice(1);
//   // Room exists in URL, load info and ask for USER
// 	if (r != 0){
//     // IMPORTANT what's going on here VV
// 		rtc.room_info(rtccopy_server, r); /* This sends a request (logic processed via 'recieve room info' cb) */
// 		var roomName = sanitize(r);
// 		document.title = roomName
//     // SET roomInput to URL 
//     roomInput.val(roomName)
//     $("#roomprompt").show();
//     $('#webrtc_room_form').on("submit", function(e) {
//       e.preventDefault();
//       transition_from_username_to_main();
//       return false;  
//     });
//   // Room does not exist in URL, create one!
// 	} else {
// 		$("#roomprompt").show();
// 		/* allow entering a room number */
// 		$('#webrtc_room_form').on("submit", function(e) {
//       e.preventDefault();
//       window.location.hash = roomInput.val();
//       transition_from_username_to_main();
//       return false;
// 		});
// 	}
	
// 	/* let's run a quick check before we begin to make sure we have rtc datachannel support */
// 	var rtc_status = rtc.checkDataChannelSupport();
// 	if (rtc_status != reliable_true) {
// 		display_error();
// 	}
// }


/* handles the processing of the room state on the username page
 * -at this point we can assume all Chrome(Opera shows up as "Chrome") & Firefox versions can get along
 * -just throw an error if we dectect another browser
 */
function process_room_state(data) {
	if (data.browser != "") { /* will be blank if new room */
		// var browser_color = 'red';
		// if ((browser_name == "chrome" || browser_name == "firefox") && (data.browser == "chrome" || data.browser == "firefox")) { browser_color = 'green'; }
		// 	$("#room_state").append('This room already exists and the creator used:<br /> <span style="color:'+browser_color+'">'+ sanitize(data.browser) + '</span> <span style="color:'+browser_color+'">' + sanitize(data.browserVer) + '</span> without OTR.<br /><br />');
		
		$("#room_state").append('This room already exists');
	}
}





//
//
//
//
//
//
//
//
//
/* handles the transition from the username prompt to main screen prompt */
function startDownloadServer(usernameFromPeerJS,roomNameFromPeerJS) {
	username = usernameFromPeerJS
  rtc.room_info(rtccopy_server, roomNameFromPeerJS);
	init(roomNameFromPeerJS); 
}


/* adds to your chat */
function addToChat(msg, color) {
  var messages = document.getElementById('messages');
  msg = sanitize(msg);
  if(color) {
    msg = '<span style="color: ' + color + '; padding-left: 15px">' + msg + '</span>';
  } else {
    msg = '<strong style="padding-left: 15px">' + msg + '</strong>';
  }
  messages.innerHTML = messages.innerHTML + msg + '<br>';
  messages.scrollTop = 10000;
}

/* adds small text to chat */
function systemMessage(msg) {
  var messages = document.getElementById('messages');
  msg = sanitize(msg);
  msg = '<strong class="small" style="padding-left: 15px">' + msg + '</strong>';
  messages.innerHTML = messages.innerHTML + msg + '<br>';
  messages.scrollTop = 10000;
}

/* Use this to avoid xss
 * recommended escaped char's found here - https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
 */
function sanitize(msg) {
  msg = msg.toString();
  return msg.replace(/[\<\>"'\/]/g,function(c) {  var sanitize_replace = {
		"<" : "&lt;",
		">" : "&gt;",
		'"' : "&quot;",
		"'" : "&#x27;",
		"/" : "&#x2F;"
	}
	return sanitize_replace[c]; });
}

/* WebRTC functionality */
var dataChannelChat = {
	broadcast: function(message) {
		for(var connection in rtc.dataChannels) {
			var channel = rtc.dataChannels[connection];
			if (rtc.connection_ok_to_send[connection]) {

					channel.send(message);

			} else {
				console.log("unable to send message to " + connection);
			}
		}
	},
	send: function(connection, message) {
		var channel = rtc.dataChannels[connection];
		if (rtc.connection_ok_to_send[connection]) {


				channel.send(message);

		} else {
			console.log("unable to send message to " + connection);
		}
	},
	recv: function(channel, message) {
		return message; /* need to do post processing later */
	},
	event: 'data stream data'
};





/* init - starts WebRTC connection, called after username is entered */
function init(roomNameFromPeerJS) {

  if(!PeerConnection) {
		display_error();
		return;
  }
  
  /* the room # is taken from the url */
  var room = roomNameFromPeerJS
  
  /* Add an entry to the username list at id=0 with your name */
  create_or_clear_container(0,username);
  

  if (room != 0) {
	  
	  /* the important call */
	  // rtc.connect(rtccopy_server, room, username, encryption_type);

    rtc.connect(rtccopy_server, room, username);

	  /* fire when ready to init chat & communication! */
	  rtc.on('ready', function(my_socket, usernames) {
		
			/* first, print out the usernames in the room */
			var username_arr = [];//convert to array
			for (var x in usernames) {
				if (x != my_socket) {//no reason to print yourself
					username_arr.push(usernames[x]);
				}
			}

			usernames_list = username_arr.join(",");//then join
			$('#pleasewait').hide();
			$('#chatinput').show();//show the text input box now
			accept_inbound_files();
			if (username_arr.length > 0) {
				systemMessage("Other users currently in the room: " + usernames_list);
			} else {
				systemMessage("There are no other users currently in this room!");
			}
	  });
	  
	  /* when a new user's data channel is opened and we are offering a file, tell them */
	  rtc.on('data stream open', function(id, username) {
	    /* add to usernames list */
			create_or_clear_container(id, username);
			/* log a message (we do this in crypto.js if crypto is enabled) */
			
			systemMessage('now connected to ' + username);
				/* if we have a file, send it their way */
			send_meta(id);
		});
	  
	  /* when another user disconnects */
	  rtc.on('disconnect stream', function(disconnecting_socket, disconnecting_username) {
			systemMessage(disconnecting_username + " has left the room");
			remove_container(disconnecting_socket);
	  });
	  
    initChat();
	  /* start the chat box */
	  
	  /* add Room Name */
	  // var roomname = document.getElementById('roomname');
	  // roomname.innerHTML = sanitize(room);
	}
};

/* start the chat box */
function initChat() {
  var chat;

  console.log('initializing data channel chat');
  chat = dataChannelChat;
  
  // var input = document.getElementById("chatinput");
  // var room = window.location.hash.slice(1);
  // var color = hsv_random_color(Math.random(), .5, .7); /* This values appear to make all text readable - test via /test/color_tester.html */

  // input.addEventListener('keydown', function(event) {
  //   var key = event.which || event.keyCode;
  //   if(key === 13) {
  //     chat.broadcast(JSON.stringify({
  //       "eventName": "chat_msg",
  //       "data": {
  //         "messages": input.value,
  //         "room": room,
  //         "color": color
  //       }
  //     }));
  //     addToChat(username+": "+input.value);
  //     input.value = "";
  //   }
  // }, false);
  
  /* this function is called with every data packet recieved */
  rtc.on(chat.event, function(conn, data, id, username) {
    /* decode and append to data */
    data = chat.recv.apply(this, arguments);
		packet_inbound(id, data);
  });
};

/* main packet processor! */
/* message is a json string */
function packet_inbound(id, message) {

	if (message.byteLength) { /* must be an arraybuffer, aka a data packet */
		//console.log('recieved arraybuffer!');
		process_binary(id,message,0); /* no reason to hash here */
	} else {
		data = JSON.parse(message).data;
		
		data.id = id;
		data.username = rtc.usernames[id]; /* username lookup */
		
		/* pass data along */
		if (data.messages) {
			/* chat */
			addToChat(data.username+": "+data.messages, data.color.toString(16));
		} else {
			/* metadata on file */
			process_data(data);
		}
	}
}

/* bootstrap alerts! */
function boot_alert(text) {
	$("#alerts").append('<div class="alert alert-danger alert-dismissable">'+text+'<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>');
}


/* HSV idea from http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/ */
/* returns random hex color */
function hsv_random_color(h, s, v) {
	var r = 0;var g = 0;var b = 0;
	var h_i = parseInt(h*6);
	var f = h*6 - h_i;
	var p = v * (1 - s);
	var q = v * (1 - f*s);
	var t = v * (1 - (1 - f) * s);
	switch(h_i) {
		case 0:
		r = v; g = t; b = p;
		break;
		case 1:
		r = q; g = v; b = p;
		break;
		case 2:
		r = p; g = v; b = t;
		break;
		case 3:
		r = p; g = q; b = v;
		break;
		case 4:
		r = t; g = p; b = v;
		break;
		case 5:
		r = v; g = p; b = q;
		break;
		default:
		console.log("Failed to generate random color? h_i="+h_i);
	}
	var red = parseInt(r*256);
	var green = parseInt(g*256);
	var blue = parseInt(b*256);

	var rgb = blue | (green << 8) | (red << 16);
	return '#' + rgb.toString(16);
}

window.onresize = function(event) {
  //onresize - do nothing
};

/* bootstrap toggle userlist on smaller screens */
$(document).ready(function() {
	$('[data-toggle=offcanvas]').click(function() {
		$('.row-offcanvas').toggleClass('active');
	});
});
