/***************
	FILE TRANSACTIONS
	
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

window.requestFileSystem = window.requestFileSystem ||
                           window.webkitRequestFileSystem;
window.URL = window.URL || window.webkitURL;
window.storageInfo = window.storageInfo ||
                     window.webkitStorageInfo;

/* event delegation 
 * -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
 * -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed 
 */
function fileEventHandler(e) {
	e = e || window.event;
	var target = e.target || e.srcElement;
	if (target.id.search('-download') != -1) {
		download_file(target.id.replace("-download", ""));
	} else if (target.id.search('-cancel') != -1) {
		cancel_file(target.id.replace("-cancel", ""));
	} else if (target.id == 'upload_stop') {
		upload_stop();
	}
}
document.body.addEventListener('click',fileEventHandler,false);

/* sending functionality, only allow 1 file to be sent out at a time */
this.chunks = {};
this.meta = {};
this.filesysteminuse = false;
this.FSdebug = false;
this.chunksPerACK = 16; /* 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time) */


/*
 * Maximum chunk size is currently limited to 16k.
 *
 * For those who care:
 * - JS should not have to handle chunking passed keeping the browser responsive. 
 * - There should be no sending size limit.
 *
 *	see:
 *		https://code.google.com/p/webrtc/issues/detail?id=2270#c35
 *		https://code.google.com/p/webrtc/issues/detail?id=2279#c18
 *		http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-07#section-6.6
 */
function get_chunk_size(me, peer) {
		return 16000;
}

/* Used in Chrome to handle larger files (and firefox with idb.filesystem.js) */
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
var file_to_upload;    /* "pointer" to external file */

/* recieving functionality, values stored per user id */
var fs = [];  /* hold our filesystems for download files */
var saved_fileEntry = []; /* holds temporary fileEntry's during last encryption hash check */
this.downloading = []; /* downloading or not */
this.recieved_meta = []; /* the file meta data other users send over */
this.recievedChunks = []; /* store the chunks in memory before writing them to filesystem */
this.recievedChunksWritePointer = []; /* stores the # of the next chunk to be written to the filesystem */
this.createdChunksWritePointer = []; /* true if the file has been created*/
this.requestedChunksWritePointer = []; /* stores the value of the next chunk to be requested */


/* stop the uploading! */
function upload_stop() {
	/* remove data */
	this.chunks = {};
	this.meta = {};

  bigFile = false;
  var filecontainer = document.getElementById("0");
	filecontainer.classList.remove('file-entry')

	/* send a kill message */
	dataChannelChat.broadcast(JSON.stringify({
		"eventName": "kill_msg",
		"data": {
			"kill": true
		}
	}));
	
	/* also clear the container */
	create_or_clear_container(0,username);
	
	//  firefox and chrome specific I think, but clear the file input 
	// document.getElementById('select_file').value='';
}

/* write a peice of a file to a file on the filesystem... allows for unlimited file size!
 * FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(
 */
function write_to_file(user_id, user_username, chunk_data, chunk_num, hash) {

	/* store our chunk temporarily in memory */
	this.recievedChunks[user_id][chunk_num % chunksPerACK] = chunk_data;
	
	/* once done recieving all chunks for this ack, start writing to memory */
	if (chunk_num %chunksPerACK == (chunksPerACK-1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num+1)) {
		store_in_fs(user_id, user_username, hash);
	}
}

/* only called by write_to_file */
function store_in_fs(user_id, user_username, hash) {
	
	/* massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem */
	if (createdChunksWritePointer[user_id] == false) {
		options = { create: true };
		createdChunksWritePointer[user_id] = true;
	} else {
		options = { create: false };
	}
	
	fs[user_id].root.getFile(
		this.recieved_meta[user_id].name,
		options,
		function(fileEntry) {
			/* create a writer that can put data in the file */
			fileEntry.createWriter(function(writer) {
			
				/* once we have written all chunks per ack */
				writer.onwriteend = function() {

					/* request the next chunk */
					recievedChunks[user_id] = [];
					requestedChunksWritePointer[user_id] += chunksPerACK;

					if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
						request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
					}
				};
				
				writer.onerror = FSerrorHandler;

				/* build the blob based on the binary array this.recievedChunks[user_id] */
				var builder = new Blob(this.recievedChunks[user_id], [this.recieved_meta[user_id].type]);
				
				/* debug */
				if (FSdebug) {
					console.log("DEBUG: writing chunk2 "+ recievedChunksWritePointer[user_id]);
					for (i=0;i<this.chunksPerACK;i++) {
						if (recievedChunks[user_id][i]) {
							console.log('recived: '+CryptoJS.SHA256(_arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
						}
					}
				}
				
				/* write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack. */
				var seek = recievedChunksWritePointer[user_id] * get_chunk_size($.browser.name, recieved_meta[user_id].browser);
				writer.seek(seek);
				writer.write(builder);
				recievedChunksWritePointer[user_id] += chunksPerACK;
				
				/* EOF condition */
				if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
						
					/* stop accepting file info */
					this.downloading[user_id] = false;
			
						if (is_chrome) {
							create_file_link (recieved_meta[user_id], user_id, user_username, fileEntry);
						} else {
							/* one little idb.filesystem.js quirk */
							fileEntry.file(function(file) { 
								create_file_link (recieved_meta[user_id], user_id, user_username, file); /* <-- file, not fileEntry */
							});
						}
				}
			}, FSerrorHandler);
		}, FSerrorHandler);
}


/* process local inbound files */
function process_inbound_files(file) {

	file_to_upload = file;
	this.meta.name = file.name;
  this.meta.filesDropped = filesDropped
	this.meta.size = file.size;
	this.meta.filetype = file.type;
	this.meta.browser = $.browser.name; /* need browser name to set chunk size */
	send_meta();
	systemMessage("file ready to send");
	/* user 0 is this user! */
	create_upload_stop_link(file_to_upload.name, 0, username);
}

var filesDropped = 0
/* Document bind's to accept files copied. Don't accept until we have a connection */
function accept_inbound_files() {

//

}




/* inbound - recieve binary data (from a file)
 * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
 */
function process_binary(id,message,hash) {
	if (!this.downloading[id]) {
		return;
	}
	
	if (this.FSdebug) {
		console.log("processing chunk # " + this.recieved_meta[id].chunks_recieved);
	}
	


	/* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
	/* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */
	
	write_to_file(id, rtc.usernames[id], message, this.recieved_meta[id].chunks_recieved, hash);
	this.recieved_meta[id].chunks_recieved++;
	
	if (this.recieved_meta[id].numOfChunksInFile > this.recieved_meta[id].chunks_recieved) {
		update_container_percentage(id, rtc.usernames[id], this.recieved_meta[id].chunks_recieved - 1, this.recieved_meta[id].numOfChunksInFile, this.recieved_meta[id].size);
	} else {
		/* stop accepting file info */
		this.downloading[id] = false;
		/* creating the download link is handled by write_to_file */
	}
}

/* inbound - recieve data
 * note that data.chunk refers to the incoming chunk #
 */
function process_data(data) {
	
	if (data.file_meta) {
		/* we are recieving file meta data */
	
		/* if it contains file_meta, must be meta data! */
		this.recieved_meta[data.id] = data.file_meta;
		this.recieved_meta[data.id].numOfChunksInFile = Math.ceil(this.recieved_meta[data.id].size / get_chunk_size(this.recieved_meta[data.id].browser, $.browser.name));
		this.recieved_meta[data.id].name = sanitize(this.recieved_meta[data.id].name);
		
		/* we are not downloading anymore if we just got meta data from a user
		 * call to create_pre_file_link is reliant on this to not display [c] button on new file information
		*/
		this.downloading[data.id] = false;
		delete_file(data.id);
		
		
		/* create a download link */
		create_pre_file_link(this.recieved_meta[data.id], data.id, data.username);
		
		/* if auto-download, start the process */
		/* removed feature
		if ($("#auto_download").prop('checked')) {
			download_file(data.id);
		}
		*/
		
		console.log(this.recieved_meta[data.id]);
	} else if (data.kill) {
		/* if it is a kill msg, then the user on the other end has stopped uploading! */
		
		this.downloading[data.id] = false;
		delete_file(data.id);
		if (this.recieved_meta[data.id]) {
			this.recieved_meta[data.id].chunks_recieved = 0;
		}
		create_or_clear_container(data.id, data.username);
		
	} else if (data.ok_to_download) {
		/* if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user */
		
		if (is_chrome) {
			create_file_link (recieved_meta[data.id], data.id, data.username, saved_fileEntry[data.id]);
		} else {
			/* one little idb.filesystem.js quirk */
			saved_fileEntry[data.id].file(function(file) { 
				create_file_link (recieved_meta[data.id], data.id, data.username, file); /* <-- file, not fileEntry */
			});
		}
	} else {

		/* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
		if (data.chunk % this.chunksPerACK == 0) {
			for (i=0;i<this.chunksPerACK;i++) {
				send_chunk_if_queue_empty(data.id, data.chunk + i, data.browser, data.rand, data.hash);
			}
		}
	}
}

/* request chunk # chunk_num from id, at this point just used to request the first chunk */
function request_chunk(id, chunk_num, hash) {
	if (this.FSdebug) {
		console.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
	}

	dataChannelChat.send(id, JSON.stringify({
		"eventName": "request_chunk",
		"data": {
			"chunk": chunk_num,
			"browser": $.browser.name
		}
	}));
}

/* request id's file by sending request for block 0 */
function download_file(id) {

	/* event listeners or javascript can call us, if id isn't set, must have been an event listener */
	/*if (typeof id == 'object') {
		var str = id.target.id;
		id = str.replace("-download", "");
	}*/

   // FUCK AWESOME
   // Altered from original 
   // Exands filesystem quota to allow multiple downloads

	 if (filesysteminuse) {
    window.storageInfo.requestQuota(
      webkitStorageInfo.TEMPORARY,
      recieved_meta[id].size +  100,
      function(size_of_quota_granted){
        console.log("File system quota expanded by: " + (size_of_quota_granted / 1024*1024) + "MB");
      },
      function(err){
        errorMessage("Not enough space on HD to support FileSystemAPI")
      });
	}

	window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size + 100, function(filesystem) {
		fs[id] = filesystem;
		filesysteminuse = true;
		downloading[id] = true; /* accept file info from user */
		request_chunk(id, 0, 0);
	});
	
	recieved_meta[id].chunks_recieved = 0;
	recievedChunksWritePointer[id] = 0;
	createdChunksWritePointer[id] = false;
	requestedChunksWritePointer[id] = 0;
	recievedChunks[id] = [];
}

/* delete a file - should be called when cancel is requested or kill is called */
function delete_file(user_id) {
	if (fs[user_id]) {
		this.filesysteminuse = false;
		fs[user_id].root.getFile(this.recieved_meta[user_id].name, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				console.log('File removed.');
			}, FSerrorHandler);
		}, FSerrorHandler);
	}
}

/* cancel incoming file */
function cancel_file(id) {
	this.downloading[id] = false; /* deny file info from user */
	delete_file(id);
	this.recieved_meta[id].chunks_recieved = 0;
	/* create a new download link */
	create_pre_file_link(this.recieved_meta[id], id, rtc.usernames[id]);
}

/* Play media */
function play_file(id, title, type,file) {

  var url = $('#' + id).children('a').first().attr('href');
  var filez = file;

  var audio = document.getElementById('audio');
  var playlist;
  var tracks;
  var current;
  var pButton = document.getElementById('pButton');

  $('<a href=' + url + '><li class="playlist-entry" id="'+ title +'">' + title + '</li></a>').appendTo('#playlist');

  initPlaylist();
  function initPlaylist(){
    current = 0;
    playlist = $('#playlist');
    tracks = playlist.find('li a');
    len = tracks.length - 1;
    audio.volume = .70;
    audio.play();
    pButton.className = "";
    pButton.className = "pause";
    playlist.find('a').click(function(e){
        e.preventDefault();
        link = $(this);
        current = link.parent().index();
        run(link, audio);
    });
    audio.addEventListener('ended',function(e){
        current++;
        if(current == len){
            current = 0;
            link = playlist.find('a')[0];
        }else{
            link = playlist.find('a')[current];    
        }
        run($(link),audio);
    });
  }
  
  function run(link, player){
	  if (pButton.className == "play"){
	  	pButton.className = "";
      pButton.className = "pause";
	  };

	  player.src = link.attr('href');
	  par = link.parent();
	  par.addClass('active-file').siblings().removeClass('active-file');
	  audio.load();
	  audio.play();
	  $('.nowplaying').remove();
		$('<div/>',{text:"now playing: "+ title, class:"nowplaying"}).appendTo('#playlist_box');
		$('.nowplaying').css({opacity:1,left:"1em"})
  }
}

/* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
function create_or_clear_container(id, username) {
	var filelist = document.getElementById('filelist');
	var filecontainer = document.getElementById(id);
	username = sanitize(username);
	
	/* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
	if (this.downloading[id] == true) {
		var span = document.getElementById(id + "-span");
		if (!span) {
			filecontainer.innerHTML = '<span id="'+ id +'-span"></span>';
			/* add cancel button */
			var a = document.createElement('a');
			a.download = meta.name;
			a.id = id + '-cancel';
			a.href = 'javascript:void(0);';
			a.style.cssText = 'color:red;';
			a.textContent = '[cancel]';
			a.draggable = true;
			//append link!
			filecontainer.appendChild(a);
		} else {
			span.innerHTML="";
		}
		return;
	}
	
	if (!filecontainer) {
		/* if filecontainer doesn't exist, create it */
		var fs = '<div id="' + id + '"></li>';
		filelist.innerHTML = filelist.innerHTML + fs;
	} else {
		/* if filecontainer does exist, clear it */
		filecontainer.innerHTML = '';
    filecontainer.classList.remove('file-entry')

	}
}

/* creates an entry in our filelist for a user, if it doesn't exist already */
function remove_container(id) {
	var filecontainer = document.getElementById(id);
	if (filecontainer) {
		filecontainer.remove();
	}
	if (fs[id]) {
		delete_file(id);
	}
}

/* create a link that will let the user start the download */
function create_upload_stop_link(filename, id, username) {
	
	//create a place to store this if it does not already
	create_or_clear_container(id, username);

  // How many files have 

	var filecontainer = document.getElementById(id);
	 filecontainer.classList.add('file-entry')

	//create the link
	var span = document.createElement('span');
	span.textContent = filename + ' ';
	
	var a = document.createElement('a');
	a.download = meta.name;
	a.id = 'upload_stop';
	a.href = 'javascript:void(0);';
	a.textContent = '[stop upload]';
	a.style.cssText = 'color:red;';
	a.draggable = true;
	
	//append link!
	filecontainer.appendChild(span);
	filecontainer.appendChild(a);
}

/* create a link that will let the user start the download */
function create_pre_file_link(meta, id, username) {
	
  //create a place to store this if it does not already
	create_or_clear_container(id, username);
	var filecontainer = document.getElementById(id);
  filecontainer.classList.add('file-container')
  filecontainer.classList.add('file-entry')
	
	//create the link
	var span = document.createElement('span');
	span.textContent = '';
	
	var a = document.createElement('a');
	a.download = meta.name;
	a.id = id + '-download';
	a.href = 'javascript:void(0);';
	a.textContent = meta.name + ' ' + getReadableFileSizeString(meta.size);
	a.draggable = true;
	
	//append link!
	filecontainer.appendChild(span);
	filecontainer.appendChild(a);

	//append to chat
	systemMessage(username +" is now offering file " + meta.name);
}

/* update a file container with a DL % */
function update_container_percentage(id, username, chunk_num, chunk_total, total_size) {

	create_or_clear_container(id, username);
	var span = document.getElementById(id+'-span');

	/* create file % based on chunk # downloaded */
	var percentage = (chunk_num / chunk_total) * 100;
	span.innerHTML = percentage.toFixed(1) + "% of " + getReadableFileSizeString(total_size) + ' ';
	
}

/* -h */
function getReadableFileSizeString(fileSizeInBytes) {
	var i = -1;
	var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
	do {
		fileSizeInBytes = fileSizeInBytes / 1024;
		i++;
	} while (fileSizeInBytes > 1024);
	return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

/* create a link to this file */
function create_file_link (meta, id, username, fileEntry) {
	var filetype = meta.filetype;


	//create a place to store this if it does not already
	create_or_clear_container(id, username);
	var filecontainer = document.getElementById(id);
  filecontainer.classList.add('file-entry');
	
	//create the link
	var span = document.createElement('span');
	span.textContent = '';
	var a = document.createElement('a');
	a.download = meta.name;
	/* One difference with Chrome & FF :( */
	if (is_chrome) {
		/* we are going to link to our local file system */
		var filez = fileEntry.toURL();
		a.href = fileEntry.toURL();
	} else {
		/* fileEntry is actually not a FileEntry, but a blob in Chrome */
		a.href = window.URL.createObjectURL(fileEntry);
	}
	a.textContent = meta.name;
	a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
	a.draggable = true;

	//append link!
	var messages = document.getElementById('messages');
	filecontainer.appendChild(span);
	filecontainer.appendChild(a);
	
	/* make delete button */
	filecontainer.innerHTML = filecontainer.innerHTML+ " ";

	// add play button
	if (filetype === "audio/mp3" || filetype === "audio/wav" ){
	  var name = meta.name;
	  var name = name.substr(0, name.lastIndexOf('.'));

	  play_file(id, name, filetype,filez);
	}



	
	//append to chat
	systemMessage(username +"'s file " + meta.name + " is ready to save locally");
}

/* send out meta data, allow for id to be empty = broadcast */
function send_meta(id) {
	if (jQuery.isEmptyObject(this.meta)) {
		return;
	}
	if (!id) {
		dataChannelChat.broadcast(JSON.stringify({
			"eventName": "data_msg",
			"data": {
				"file_meta": this.meta
			}
		}));
	} else {
		dataChannelChat.send(id, JSON.stringify({
			"eventName": "data_msg",
			"data": {
				"file_meta": this.meta
			}
		}));
	}
}

/* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {
	if ( chunk_num >= Math.ceil(file_to_upload.size / get_chunk_size($.browser.name, other_browser))) {
		return;
	}
	
	sendchunk(id, chunk_num, other_browser, rand, hash);
}

/* Please note that this works by sending one chunk per ack */
function sendchunk(id, chunk_num, other_browser, rand, hash) {
	/* uncomment the following lines and set breakpoints on them to simulate an impaired connection */
	/* if (chunk_num == 30) { console.log("30 reached, breakpoint this line");}
	if (chunk_num == 50) { console.log("30 reached"); }*/

	var reader = new FileReader;
	var upper_limit = (chunk_num + 1) * get_chunk_size(other_browser, $.browser.name);
	if (upper_limit > this.meta.size) { upper_limit = this.meta.size; }
	
	var seek = chunk_num * get_chunk_size(other_browser, $.browser.name);
	var blob = file_to_upload.slice(seek, upper_limit);
	reader.onload = function(event) { 
		if (reader.readyState == FileReader.DONE) {
			
			// if (encryption_type != "NONE") {
			// 	file_encrypt_and_send(id, event.target.result, rand, chunk_num);
			// } else {
				if (FSdebug) {
					console.log("DEBUG: sending chunk "+ chunk_num);
					console.log('sending: '+CryptoJS.SHA256(_arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
				}
				dataChannelChat.send(id, event.target.result);
			// }
		}
		
		
	}
	reader.readAsArrayBuffer(blob);
}

/***** File System Errors *****/
//credit - http://www.html5rocks.com/en/tutorials/file/filesystem/
function FSerrorHandler(e) {
  var msg = '';
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };
  console.error('Error: ' + msg);
}

//used for debugging - credit - http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function _arrayBufferToBase64( buffer ) {
    var binary = ''
    var bytes = new Uint8Array( buffer )
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
    }
    return window.btoa( binary );
}
