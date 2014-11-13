var sendToRTCio = false;
var statusCol;

var dropzone = document.querySelector('body');
var invisibleInput = document.querySelector('#invisible-file-input');

// Allow dropping and style dropzone
(function() {
  dropzone.addEventListener('dragenter', function(e) {
    doNothing(e);
    this.classList.add('dropping');
  }, false);

  dropzone.addEventListener('dragover', function(e) {
    doNothing(e);
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }, false);

  dropzone.addEventListener('dragleave', function(e) {
   this.classList.remove('dropping');
  }, false);
  
  dropzone.addEventListener('drop', function(e) {
    doNothing(e);
    this.classList.remove('dropping');
    fileRouter(e.dataTransfer.files);
  }, false);

  invisibleInput.addEventListener('change', function(e){
    fileRouter(this.files)
  });

})();

// Helper for drop functionality
function doNothing(e){
  e.stopPropagation();
  e.preventDefault();
}

var bigFile = false;
// Decide whether to send to webRTCio or not
function fileRouter(files){
  //var files = files
  var fileCount = files.length
  var totalSize = 0

  // Handle a single file
  if ( fileCount == 1 ) {
    var file = files[0]

    checkIfFile(file, function(){
      if ( file.size > 304857600 ) {  
        if ( !bigFile ) {     
          process_inbound_files(file)
          bigFile = true;
        } else {
          errorMessage("One large file at a time, stop upload to add a new one")
          $('#file_list').hide();
          $('#download_list_box').hide();
          $('#big_files_box').show();
          $('#bigfiles').addClass('file_menu-active');
          $('#my_files').removeClass('file_menu-active');
          $('#downloads').removeClass('file_menu-active');
        }
      } else {
        // do nothing, handled by dragDrop below
      }      
    }, function(){
      errorMessage("Cannot identify file type.")
    });

  // Handle multiple files
  } else if (fileCount > 1 ) {
    // do nothing, handled by dragDrop below
  }
}

var globalChat = $('#global_chat');

var errorMessage = function(msg){
  var error_message = $('<div style="color:red"><em>'+msg+'</em></div>').addClass('messages')
  globalChat.append(error_message);
}

dragDrop('body', function(files){
  client.seed(files, function(torrent){

    // UPLOADING TORRENT
    fileList = []

    var torrentSize = 0
    torrent.files.forEach(function(file,index){
      torrentSize += file.length
      fileList.push(file.name)
    });

    sessionTorrents.push({"infoHash": torrent.infoHash , "name": torrent.name, "length": torrent.files.length, "size": torrentSize, "fileList": fileList})

    eachActiveConnection(function(c, $c) {
      if (c.label === 'torrentz') {
        c.send([torrent.infoHash,torrent.name,torrent.files.length,torrentSize,fileList]);
      }
    });

    errorMessage('Torrent ready!')
   
    var newTorrentRow = $('<tr class="file-entry '+peer.id+'torrentz" id="'+torrent.infoHash+'">')

    var nameCol = $('<td>')
    var sizeCol = $('<td>')
    var senderCol = $('<td>')
    statusCol = $('<td id="'+torrent.infoHash+'-progress">')

    if (files.length == 1){
      nameCol.html('<span class="progress-text"> Seeding: '+torrent.name+'</span>').appendTo(newTorrentRow)
    } else {
      nameCol.html('<span class="progress-text">Seeding: '+files.length+' files</span>')
      var torrentContents = $('<ul class="torrent-contents">')
      var hiddenTorrentContents = $('<ul id="t'+torrent.infoHash+'-torrent-contents" class="torrent-contents">')
      hiddenTorrentContents.hide();
      fileList.forEach(function(name,index){
        var fileItem = $('<li>').text(name)
        fileItem.appendTo(hiddenTorrentContents);
      });
      torrentContents.appendTo(nameCol)
      hiddenTorrentContents.appendTo(nameCol)
      nameCol.appendTo(newTorrentRow);            
    }
    if(files.length>1){
      var morefiles = $('<li>').html("<a id='m"+torrent.infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-show files</a>")
      morefiles.appendTo(torrentContents);
      var hidefiles = $('<li>').html("<a id='h"+torrent.infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-hide</a>")
      hidefiles.appendTo(hiddenTorrentContents);
    }

    sizeCol.text((torrentSize/(1024*1024)).toFixed(2)+"MB").appendTo(newTorrentRow)
    senderCol.text(peer.id).appendTo(newTorrentRow)
    statusCol.appendTo(newTorrentRow)

    newTorrentRow.appendTo('#download_list');
    onTorrent(torrent)
    $("#m"+torrent.infoHash+"moreFiles").on('click',function(){
        $(this).hide();
        hiddenTorrentContents.show().css({'margin-top':'-1em'});
      });
    $("#h"+torrent.infoHash+"moreFiles").on('click',function(){
      $("#m"+torrent.infoHash+"moreFiles").show()
      hiddenTorrentContents.hide();
    });
  }); 
})



function checkIfFile(file, successCallback, errorCallback){
  if ( file.type ){
    successCallback();
  } else {
    errorCallback();
  }
}

seed = function(blob){
  client.seed(blob, function(torrent){

    // UPLOADING TORRENT
    fileList = []

    var torrentSize = 0
    torrent.files.forEach(function(file,index){
      torrentSize += file.length
      fileList.push(file.name)
    });

    sessionTorrents.push({"infoHash": torrent.infoHash , "name": torrent.name, "length": torrent.files.length, "size": torrentSize, "fileList": fileList})

    eachActiveConnection(function(c, $c) {
      if (c.label === 'torrentz') {
        c.send([torrent.infoHash,torrent.name,torrent.files.length,torrentSize,fileList]);
      }
    });

    errorMessage('Torrent ready!')
   
    var newTorrentRow = $('<tr class="file-entry '+peer.id+'torrentz" id="'+torrent.infoHash+'">')

    var nameCol = $('<td>')
    var sizeCol = $('<td>')
    var senderCol = $('<td>')
    statusCol = $('<td id="'+torrent.infoHash+'-progress">')

    if (blob.length == 1){
      nameCol.html('<span class="progress-text"> Seeding: '+torrent.name+'</span>').appendTo(newTorrentRow)
    } else {
      nameCol.html('<span class="progress-text">Seeding: '+blob.length+' files</span>')
      var torrentContents = $('<ul class="torrent-contents">')
      var hiddenTorrentContents = $('<ul id="t'+torrent.infoHash+'-torrent-contents" class="torrent-contents">')
      hiddenTorrentContents.hide();
      fileList.forEach(function(name,index){
        var fileItem = $('<li>').text(name)
        fileItem.appendTo(hiddenTorrentContents);
      });
      torrentContents.appendTo(nameCol)
      hiddenTorrentContents.appendTo(nameCol)
      nameCol.appendTo(newTorrentRow);            
    }
    if(blob.length>1){
      var morefiles = $('<li>').html("<a id='m"+torrent.infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-show files</a>")
      morefiles.appendTo(torrentContents);
      var hidefiles = $('<li>').html("<a id='h"+torrent.infoHash+"moreFiles' class='more_files' href='javascript:void(0);'>-hide</a>")
      hidefiles.appendTo(hiddenTorrentContents);
    }

    sizeCol.text((torrentSize/(1024*1024)).toFixed(2)+"MB").appendTo(newTorrentRow)
    senderCol.text(peer.id).appendTo(newTorrentRow)
    statusCol.appendTo(newTorrentRow)

    newTorrentRow.appendTo('#download_list');
    onTorrent(torrent)
    $("#m"+torrent.infoHash+"moreFiles").on('click',function(){
        $(this).hide();
        hiddenTorrentContents.show().css({'margin-top':'-1em'});
      });
    $("#h"+torrent.infoHash+"moreFiles").on('click',function(){
      $("#m"+torrent.infoHash+"moreFiles").show()
      hiddenTorrentContents.hide();
    });
  }); 
}

