// Quite heavily altered to only utilize file-transfer capabilities!
// See license below



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



var username = "";
var rtccopy_server = "ws:allthetime.io:8000";  

function process_room_state(data) {
	if (data.browser != "") { /* will be blank if new room */
	}
}

/* handles the transition from the username prompt to main screen prompt */
function startDownloadServer(usernameFromPeerJS,roomNameFromPeerJS) {
	username = usernameFromPeerJS
  rtc.room_info(rtccopy_server, roomNameFromPeerJS);
	init(roomNameFromPeerJS); 
}

/* adds small text to chat */
function systemMessage(msg) {
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
			}
		}
	},
	send: function(connection, message) {
		var channel = rtc.dataChannels[connection];
		if (rtc.connection_ok_to_send[connection]) {


				channel.send(message);

		} else {
		}
	},
	recv: function(channel, message) {
		return message; /* need to do post processing later */
	},
	event: 'data stream data'
};

function init(roomNameFromPeerJS) {

  if(!PeerConnection) {
		return;
  }
  
  var room = roomNameFromPeerJS
  create_or_clear_container(0,username);
  
  if (room != 0) {

    rtc.connect(rtccopy_server, room, username);

	  rtc.on('ready', function(my_socket, usernames) {
		
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
	}
};

/* start the chat box */
function initChat() {
  var chat;

  chat = dataChannelChat;
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
		
		process_data(data);
		
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

