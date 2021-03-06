var sounds = [];
var current;
var audio;
var playlist;
var tracks;
$('document').ready(function(){

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

  var first;
  reader = new FileReader();
  
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
      addSongBlobToIDB(tags,blob,title)
      var songRow = $('<tr class="file-entry"><td><a href='+url+'>'+tags.artist+'</a></td><td><a href='+url+'>'+tags.title+'</a></td><td><a href='+url+'>'+tags.album+'</a></td><td><a href='+url+'>'+tags.track.split("/")[0]+'</a></td><td><a href='+url+'>'+tags.year+'</a></td></tr>')
      songRow.appendTo('#playlist-tbody');
      $("#playlist").trigger('addRows',[songRow,true]); 
      initPlaylist(tags,title);

      
    }, {
      tags: ["title","artist","album","year","track"],
      dataReader: FileAPIReader(blob)
    });
  };
  reader.readAsArrayBuffer(blob);

}

function initPlaylist(tag,filename){
  current = 0;
  audio = $('#audioplayer')[0];
  playlist = $('#playlist-tbody');
  tracks = playlist.find('tr');
  len = tracks.length;

  
  playlist.find('a').on('click',function(e){
    
    e.preventDefault();
    audio.play();
    $('.nowplaying').remove();
    link = $(this);
    current = link.parent().parent().index();
    run(link, audio, filename);

  });

  audio.addEventListener('ended',function(e){

    $('.nowplaying').remove();
    current++;
    
    if(current == len){

      current = 0;
      var row = playlist.find('tr')[current];
      link = $(row).find('td').find('a')[1]; 
    
    }else{
       
        var row = playlist.find('tr')[current];
        link = $(row).find('td').find('a')[1];    
    
    }
    
    run($(link),audio, filename);
  });
}

function run(link, player, filename){
  var songArtist = $(link[0]).parent().parent().find('a')[0];
  var songTitle = $(link[0]).parent().parent().find('a')[1];
  var songAlbum = $(link[0]).parent().parent().find('a')[2];
  var songNum = $(link[0]).parent().parent().find('a')[3];
  nowPlaying = $(songArtist).text()+" - "+$(songTitle).text();
  $('<div />',{class:'nowplaying', text:nowPlaying}).appendTo('#now_playing');
  $('<span><a href="'+link.attr('href')+'" download="'+songArtist.innerText+' - ' + songAlbum.innerText +' - '+ songNum.innerText +' - ' + songTitle.innerText +'-RTOS.mp3"> &#xf063</a></span>').prependTo('.nowplaying');      
  $('#audioplayer')[0].src = link.attr('href');
  par = link.parent();
  par.addClass('active-file').siblings().removeClass('active-file');
  player.load();
  player.play();
}