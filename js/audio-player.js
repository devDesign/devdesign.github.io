var sounds = [];
$('document').ready(function(){

  $('#audio').bind('ended', function() {
   $('.nowplaying').remove()
  });

  $('#audio').bind('play', function(e) {
    $('.nowplaying').remove();
    if (nowPlaying) {
      $('<div />',{class: 'nowplaying', text: nowPlaying}).appendTo('#now_playing');
    }
  });

  $(window).on('resize', function(){
    var timelineWidth = $('#timeline').width() - $('#playhead').width();
  });

  var duration;
 
});

function play_torrent_file(url, title, type, blob) {
  var audio;
  var playlist;
  var tracks;
  var current;
  var first;
  reader = new FileReader();
  console.log(blob);
  
  reader.onload = function(event) {
    ID3.loadTags(url, function() {

      tags = ID3.getAllTags(url);
      if(!tags.title){
        tags.title=title;
      }
      if(!tags.year){
        tags.year=" ";
      }
      if(!tags.track){
        tags.track=" / ";
      }
      if(!tags.artist){
        tags.artist=" ";
      }
      var songRow = $('<tr class="file-entry"><td><a href='+url+'>'+tags.artist+'</a></td><td><a href='+url+'>'+tags.title+'</a></td><td><a href='+url+'>'+tags.album+'</a></td><td><a href='+url+'>'+tags.track.split("/")[0]+'</a></td><td><a href='+url+'>'+tags.year+'</a></td></tr>')
      songRow.appendTo('#playlist-tbody');
      $("#playlist").trigger('addRows',[songRow,true]); 
      initPlaylist(tags);
      function initPlaylist(tag){
        first = 0
        current = 0;
        audio = $('#audioplayer')[0];
        playlist = $('#playlist-tbody');
        tracks = playlist.find('tr');
        len = tracks.length - 1;
        audio.volume = .70;
       playlist.find('a').click(function(e){
            first++;
            $('.nowplaying').remove();
            e.preventDefault();
            link = $(this);
            current = link.parent().parent().index();
            run(link, audio);
        });
        audio.addEventListener('ended',function(e){
            $('.nowplaying').remove();
            first++;
            current++;
            if(current == len){
                current = 0;
                link = playlist.find('a')[0];
            }else{
                var row = playlist.find('tr')[current]
                link = $(row).find('td').find('a')[1];    
            }
            run($(link),audio);
        });
      }
      
      function run(link, player){
        var songArtist = $(link[0]).parent().parent().find('a')[0];
        var songTitle = $(link[0]).parent().parent().find('a')[1];
        var songAlbum = $(link[0]).parent().parent().find('a')[2];
        nowPlaying = $(songArtist).text()+" - "+$(songTitle).text();
        $('<div />',{class:'nowplaying', text:nowPlaying}).appendTo('#now_playing');
        player.src = link.attr('href');
        par = link.parent();
        par.addClass('active-file').siblings().removeClass('active-file');
        player.load();
        if(first>1){
          player.play();
        }
      }
      
    }, {
      tags: ["title","artist","album","year","track"],
      dataReader: FileAPIReader(blob)
    });
  };
  reader.readAsArrayBuffer(blob);

}