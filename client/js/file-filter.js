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

       // id3(file, function(err, tags) {
       //  console.log(tags);
       //  });

    checkIfFile(file, function(){
      if ( file.size > 104857600 ) {  
        if ( !bigFile ) {     
          process_inbound_files(file)
          bigFile = true;
        } else {
          errorMessage("One large file at a time, stop upload to add a new one")
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
  var error_message = $('<div style="color:red;"><em>'+msg+'</em></div>').addClass('messages')
  globalChat.append(error_message);
}

dragDrop('body', function(files){
  client.seed(files, function(torrent){

    // UPLOADING TORRENT


    var torrentSize = 0
    torrent.files.forEach(function(file,index){
      torrentSize += file.length
    });

    sessionTorrents.push({"infoHash": torrent.infoHash , "name": torrent.name, "length": torrent.files.length, "size": torrentSize})

    eachActiveConnection(function(c, $c) {
      if (c.label === 'torrentz') {
        c.send([torrent.infoHash,torrent.name,torrent.files.length,torrentSize]);
      }
    });

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
