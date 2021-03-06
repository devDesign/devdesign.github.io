var db;
var songBlobs = [];
var f;
var nowPlayingLocalUrl;
 
function indexedDBOk() {
    return "indexedDB" in window;
}
 
document.addEventListener("DOMContentLoaded", function() {
 
    //No support? Go in the corner and pout.
    if(!indexedDBOk) return;
 
    var openRequest = indexedDB.open("rtos",1);
 
    openRequest.onupgradeneeded = function(e) {
        var thisDB = e.target.result;
 
        if(!thisDB.objectStoreNames.contains("songs")) {
            thisDB.createObjectStore("songs",{keyPath:'filename'});
        }
        if(!thisDB.objectStoreNames.contains("files")) {
            thisDB.createObjectStore("files",{keyPath:'filename'});
        }
    }
 
    openRequest.onsuccess = function(e) {
        console.log("running onsuccess");
        db = e.target.result;
        addFileHistory();

    }
 
    openRequest.onerror = function(e) {
        //Do something for the error
    }

 
},false);
 
function  addSongBlobToIDB(tags,blob,filename) {
    console.log("About to add "+filename);
 
    var transaction = db.transaction(["songs"],"readwrite");
    var store = transaction.objectStore("songs");
 
    //Define a person
    var songBlob = {
        tags:tags,
        filename:filename,
        blob:blob,
        date: getDate()
    }
 
    //Perform the add
    var request = store.add(songBlob);
 
    request.onerror = function(e) {
        console.log("Error",e.target.error.name);
        //some type of error handler
    }
 
    request.onsuccess = function(e) {
        console.log("e");
    }
}
function getDate(){
    return new Date().format("m-dd HH:MM tt");
}
function  addFilenamesToIDB(blob,filename,filetype) {
    console.log("About to add "+filename);
    var transaction = db.transaction(["files"],"readwrite");
    var store= transaction.objectStore("files");

    var file = {
        filename:filename,
        filetype:filetype,
        blob:blob,
        dateString:getDate()
    }
 
    //Perform the add
    var request = store.add(file);
 
    request.onerror = function(e) {
        console.log("Error",e.target.error.name);
        //some type of error handler
    }
 
    request.onsuccess = function(e) {

        addFileRow(blob,filename,filetype,getDate());

        $('.delete').on('click',function(){

            var key = $(this).parent().siblings()[1];
            deleteFile($(key).text().substr(1))
            $(this).parent().parent().remove();

        })
        
    }
}

function  addTorrentIDB(torrent) {
    console.log("About to add "+torrent.infoHash);
 
    var transaction = db.transaction(["torrents"],"readwrite");
    var store = transaction.objectStore("torrents");
 
    //Define a person
    var torrentinfo = {infoHash:torrent}
 
    //Perform the add
    var request = store.add(torrentinfo);
 
    request.onerror = function(e) {
        console.log("Error",e.target.error.name);
        //some type of error handler
    }
 
    request.onsuccess = function(e) {

    }
}

function addSongHistory(){
    var objectStore = db.transaction("songs").objectStore("songs");
    var url
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      
      if (cursor) {
        filename =cursor.value.filename;
        tags=cursor.value.tags;
        blob=cursor.value.blob;
        url=URL.createObjectURL(cursor.value.blob);
        var songRow = $('<tr class="file-entry"><td><a href='+url+'>'+tags.artist+'</a></td><td><a href='+url+'>'+tags.title+'</a></td><td><a href='+url+'>'+tags.album+'</a></td><td><a href='+url+'>'+tags.track.split("/")[0]+'</a></td><td><a href='+url+'>'+tags.year+'</a></td></tr>')
        songRow.appendTo('#playlist-tbody');
        $("#playlist").trigger('addRows',[songRow,true]); 
        
        addFileRow(blob,filename,"audio/mp3",cursor.value.date)
        cursor.continue();

      }
      else {
     
        initPlaylist(tags,filename);
      }
    };
}

function addFileHistory(){
    addSongHistory();
    var objectStore = db.transaction("files").objectStore("files");

    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      var blob
      if (cursor) {
        blob=cursor.value.blob;
        var url = URL.createObjectURL(cursor.value.blob)
        addFileRow(blob,cursor.value.filename,cursor.value.filetype,cursor.value.dateString);
        cursor.continue();
      }
      else {
        $('.delete').on('click',function(){
            var key = $(this).parent().siblings()[1];
            deleteFile($(key).text().substr(1))
            $(this).parent().parent().remove();
        })
      }

    };
}

function seedSongHistory(){
    var objectStore = db.transaction("songs").objectStore("songs");
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        var blob=cursor.value.blob;
        blob.name=cursor.value.filename;
        songBlobs.push(blob)
        cursor.continue();
      }
      else {
        console.log('adding'+songBlobs);

      }
    
}}

function deleteFile(key){
    var request = db.transaction("files", "readwrite")
                .objectStore("files")
                .delete(key);
    request.onsuccess = function(event) {
    
    };
}
function getSongUrl(filename){
    var filename = filename;
    var objectStore = db.transaction("files").objectStore("files");

        objectStore.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            var songAdded=false;
            if(cursor.value.filename == filename && songAdded == false){
                nowPlayingLocalUrl = URL.createObjectURL(cursor.value.blob);
                 $('<span><a href="'+nowPlayingLocalUrl+'" target="new"> &#xf10b</a></span>').prependTo('.nowplaying');
                 songAdded=true;
            }
            cursor.continue();
          }
          else {
           
          }
        };
}