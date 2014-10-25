var sendToRTCio = false;

var dropzone = document.getElementById('dropzone');

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
    fileRouter(e);
  }, false);
})();

// Helper for drop functionality
function doNothing(e){
  e.stopPropagation();
  e.preventDefault();
}


// Decide whether to send to webRTCio or not
function fileRouter(e){
  var files = e.dataTransfer.files;
  //var files = files

  var fileCount = files.length
  var totalSize = 0

  // Handle a single file
  if ( fileCount == 1 ) {
    var file = files[0]
    checkIfFile(file, function(){
      if ( file.size > 104857600 ) {
        // DO SOMETHING! -- send to file-io.js
        process_inbound_files(file)
      } else {
        // do nothing, handled by dragDrop below
      }      
    }, function(){
      // ERROR: Files only!!
    });

  // Handle multiple files
  } else if (fileCount > 1 ) {
    // do nothing, handled by dragDrop below
  }
}

dragDrop('#dropzone', function(files){
  // does nothing if file is too big
  // see //FUCK in webtorrent.js
  // add error readout for user!
  logAppend('Creating .torrent file...<br>')
  client.seed(files, function(torrent){

    eachActiveConnection(function(c, $c) {
      if (c.label === 'torrentz') {
        c.send([torrent.infoHash,torrent.name]);
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
