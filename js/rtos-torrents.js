
download = function(infoHash) {
  client.add({
    infoHash: infoHash,
    announce: [ 'wss://tracker.webtorrent.io' ]
  }, onTorrent)
}

onTorrent = function(torrent) {
  fileList = []
  var torrentSize = 0
  torrent.files.forEach(function(file,index){
    torrentSize += file.length
    fileList.push(file.name)
  });

  sessionTorrents.push({"infoHash": torrent.infoHash , "name": torrent.name, "length": torrent.files.length, "size": torrentSize, "fileList": fileList});
  
  if((path.extname(torrent.files[0].name)===".mp4" || path.extname(torrent.files[0].name)===".webm") && torrent.swarm._peers.undefined != null){
    var file = torrent.files[0]
    var video = vidBox.find('video')[0];
    video.controls = true
    document.body.appendChild(vidBox[0]);
    file.createReadStream().pipe(video)
  }

  var progressSpan = $('#'+torrent.infoHash+'-progress').addClass('progress-text');
  var torrentDownloading = true;
  torrent.swarm.on('download', function () {
    var progress = (100 * torrent.downloaded / torrent.parsedTorrent.length).toFixed(1)
    if(progress<99.9){
      progressSpan.html("downloading..<br />progress: "+progress+"% <br>download: "+prettysize(torrent.swarm.downloadSpeed())+"/s"+"<br />upload: "+prettysize(client.uploadSpeed())+"/s <br />connected peers: "+torrent.swarm.numPeers);
    } else{
      torrentDownloading= false;
      progressSpan.html("download complete..<br />seeding..<br />awaiting peers..<br />")
    }
  })

  torrent.swarm.on('upload', function () {
    progressSpan.html("seeding..<br />total: "+ prettysize(torrent.swarm.uploaded)+"<br /> upload: "+prettysize(client.uploadSpeed())+"/s <br />connected peers: "+torrent.swarm.numPeers)
  })


  var numberOfFiles = torrent.files.length
  var filesProcessed = 0

  torrent.files.forEach(function (file,index) {
    var extname = path.extname(file.name)

      file.createReadStream().pipe(concat(function (buf) {
        filesProcessed ++ 

          var icon = "&#xf15b;"
          if (extname == ".mp3"){
            file.type = "audio/mp3"
            var icon = "&#xf001;"
          } else if (extname == ".wav"){
            file.type = "audio/wav"
            var icon = "&#xf001;"
          } else if (extname == ".mp4"){
            file.type = "video/mp4"
            var icon = "&#xf008;"
          } else if (extname == ".mp4"){
            file.type = "video/webm"
            var icon = "&#xf008;"
          } else if (extname.toLowerCase() == ".png"){
            file.type = "image/png"
            var icon = "&#xf1c5;"
          } else if (extname.toLowerCase() == ".jpg"){
            file.type = "image/jpg"
            var icon = "&#xf1c5;"
          } else if (extname.toLowerCase() == ".gif"){
            file.type = "image/gif"
            var icon = "&#xf1c5;"
          } else if (extname.toLowerCase() == ".tiff"){
            file.type = "image/gif"
            var icon = "&#xf1c5;"
          } else if (extname.toLowerCase() == ".jpeg"){
            file.type = "image/jpeg"
            var icon = "&#xf1c5;"
          } else{
            file.type= extname;
          }

        realFile = new Blob([buf],{type:file.type})
        var url = URL.createObjectURL(realFile);

        // newTorrentRow.appendTo('#filelist')
        if(file.type.split('/')[0] != "audio" )
          addFilenamesToIDB(realFile,file.name,file.type)
        if(file.type.split('/')[0]=="audio"){
          newDataNotification('song','#my_songs','songNotification',songNotification);
          play_torrent_file(url, file.name, file.type, realFile);
          addFileRow(realFile,file.name,file.type,getDate())
        } else{
          addFilenamesToIDB(realFile,file.name,file.type)
        }
        //binding the video box

      }))
  })
}
addFileRow = function(blob,filename,filetype,dateStringNow){
  newDataNotification("file",'#my_files','fileNotification',fileNotification); 
  var extname = path.extname(filename)
  var newTorrentRow = $('<tr class="file-entry">fuck</tr>')
  var streamCol = $('<td>')
  var downloadCol = $('<td>')
  var nameCol = $('<td>')
  var sizeCol = $('<td>')
  var typeCol = $('<td>')
  var date = $('<td>')
  var icon = "&#xf15b;"

  if (extname == ".mp3"){
    filetype = "audio/mp3"
    var icon = "&#xf001;"
  } else if (extname == ".wav"){
    filetype = "audio/wav"
    var icon = "&#xf001;"
  } else if (extname == ".mp4"){
    filetype = "video/mp4"
    var icon = "&#xf008;"
  } else if (extname == ".webm"){
    filetype = "video/webm"
    var icon = "&#xf008;"
  } else if (extname.toLowerCase() == ".png"){
    filetype = "image/png"
    var icon = "&#xf1c5;"
  } else if (extname.toLowerCase() == ".jpg"){
    filetype = "image/jpg"
    var icon = "&#xf1c5;"
  } else if (extname.toLowerCase() == ".gif"){
    filetype = "image/gif"
    var icon = "&#xf1c5;"
  } else if (extname.toLowerCase() == ".tiff"){
    filetype = "image/gif"
    var icon = "&#xf1c5;"
  } else if (extname.toLowerCase() == ".jpeg"){
    filetype = "image/jpeg"
    var icon = "&#xf1c5;"
  } else{
      filetype= extname;
    }
    linkToFile = URL.createObjectURL(blob)
  
    streamCol.html('<span class="delete">&#xf00d;</span>').appendTo(newTorrentRow)
    downloadCol.html('<a download="'+filename+'" href="'+linkToFile+'"><span class="downloaded">&#xf063;</span></a>').appendTo(newTorrentRow)
    if ( filetype ){
      nameCol.html('<div class="'+filetype.split('/')[0]+'"><span class="file_list-icon">'+icon+'</span>'+filename+"</div>").appendTo(newTorrentRow);
    } else {
      nameCol.html('<div class="FILEfile"><span class="file_list-icon">'+icon+'</span>'+filename+"</div>").appendTo(newTorrentRow);
    }        
    sizeCol.text((blob.size/(1024*1024)).toFixed(2)+"MB").appendTo(newTorrentRow)
    if ( filetype ){
      typeCol.text(filetype).appendTo(newTorrentRow)
    } else {
      typeCol.text(extname).appendTo(newTorrentRow)
    }
    
    date.html(dateStringNow)
    date.appendTo(newTorrentRow);
    newTorrentRow.appendTo('#filelist-tbody'); 
    $("#filelist").trigger('addRows',[newTorrentRow,true]);
    


    if(filetype.split('/')[0] == "video"){
      $(".video").on('click',function(){
        if($('cam_box')[0] == "nopppe"){
          var vidSrc = $(this).parent().parent().find('a')[0]
          var video = $('#media_player-video')[0];
          console.log($(vidSrc).attr('href'));
          video.src = $(vidSrc).attr('href');
        } else {
          vidBox.appendTo('body');
          var vidSrc = $(this).parent().parent().find('a')[0]
          var video = $('#media_player-video')[0];
          console.log($(vidSrc).attr('href'));
          video.src = $(vidSrc).attr('href');
        }
      })
    }

    if(filetype.split('/')[0] == "image"){
      newDataNotification("image",'#my_images','imageNotification',imageNotification);
      var newimage = $('<img class="thumb" />');
      newimage[0].src = linkToFile;
      newimage[0].width = 100;
      newimage.appendTo('#my_images_list');
      $('.thumb').on('click',function(){
        if($('#pic_box')[0]){
          $('#pic_box').css({top:"1em",left:'1em'})
          var picture = $('#media_player-image')[0];
          picture.src = $(this).attr('src');
        } else {
          imgBox.appendTo('body');
          var picture = $('#media_player-image')[0];
          picture.src = $(this).attr('src');
        }
      })

      $(extname.toLowerCase()).on('click',function(){
        $('#image_player').remove();
        if($('#pic_box')[0]){
          $("<img id='media_player-image' />").appendTo('#image_player');
          $('#pic_box').css({top:"1em",left:'1em'})
          var picSrc = $(this).parent().parent().find('a')[0]
          var picture = $('#media_player-image')[0];
          picture.src = $(picSrc).attr('href');
          picture.height = get_viewpoint()[0]/2;
        } else {
          imgBox.appendTo('body');
          $("<img id='media_player-image' />").appendTo('#image_player');
          var picSrc = $(this).parent().parent().find('a')[0]
          var picture = $('#media_player-image')[0];
          picture.src = $(picSrc).attr('href');
        }
        $('#media_player-image').resizable( {aspectRatio: true, maxHeight: get_viewpoint()[1]});
      });
    }
}