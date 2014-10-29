var sendToRTCio = false;

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
  var error_message = $('<div><em>'+msg+'</em></div>').addClass('messages')
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
    onTorrent(torrent)
  }); 
})



function checkIfFile(file, successCallback, errorCallback){
  if ( file.type ){
    successCallback();
  } else {
    errorCallback();
  }
}
