var db;
 
function indexedDBOk() {
    return "indexedDB" in window;
}
 
document.addEventListener("DOMContentLoaded", function() {
 
    //No support? Go in the corner and pout.
    if(!indexedDBOk) return;
 
    var openRequest = indexedDB.open("songs",1);
 
    openRequest.onupgradeneeded = function(e) {
        var thisDB = e.target.result;
 
        if(!thisDB.objectStoreNames.contains("songs")) {
            thisDB.createObjectStore("songs",{keyPath:'filename'});
        }
    }
 
    openRequest.onsuccess = function(e) {
        console.log("running onsuccess");
        
        db = e.target.result;
        setTimeout(addSongHistory(),5000);
    }
 
    openRequest.onerror = function(e) {
        //Do something for the error
    }

 
},false);
 
function  addSongBlobToIDB(url,filename,filetype,blob) {
    console.log("About to add "+filename);
 
    var transaction = db.transaction(["songs"],"readwrite");
    var store = transaction.objectStore("songs");
 
    //Define a person
    var songBlob = {
        filename:filename,
        filetype:filetype,
        blob:blob
    }
 
    //Perform the add
    var request = store.add(songBlob);
 
    request.onerror = function(e) {
        console.log("Error",e.target.error.name);
        //some type of error handler
    }
 
    request.onsuccess = function(e) {
        linkToFile = URL.createObjectURL(blob)
        console.log("e");
        play_torrent_file(linkToFile, filename, filetype, blob);
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

    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        play_torrent_file(URL.createObjectURL(cursor.value.blob),cursor.value.filename,cursor.value.filetype,cursor.value.blob);
        cursor.continue();
      }
      else {

      }
    };
}

function addTorrentHistory(){
    var objectStore = db.transaction("torrents").objectStore("torrents");

    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        download(cursor.value.infoHash)
        cursor.continue();
      }
      else {

      }
    };
}