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

  $('#pButton').on('click', function(){

    if (audio.paused) {
      audio.play();
      pButton.className = '';
      pButton.className = 'pause';
    } else {
      audio.pause();
      pButton.className = '';
      pButton.className = 'play';
    }
  });

  $('#volume').on('change', function(){
    setVolume();
  });

  $(window).on('resize', function(){
    var timelineWidth = $('#timeline').width() - $('#playhead').width();
  });

  var audio = document.getElementById('audio');
  var duration;
  var pButton = document.getElementById('pButton');
  var playhead = document.getElementById('playhead');
  var timeline = document.getElementById('timeline');
  var timelineWidth = $('#timeline').width() - $('#playhead').width();
  var volume = document.getElementById('volume');
  console.log($('#playhead').width());
  // console.log(playhead.offsetWidth);


  audio.addEventListener('timeupdate', timeUpdate, false);

  timeline.addEventListener('click', function (event) {
    moveplayhead(event);
    audio.currentTime = duration * clickPercent(event);
  }, false);

  function setVolume() {
    audio.volume = volume.value;
  }

  function movesoundhead(e) {
    var newMargLeft = e.pageX - timeline.offsetLeft;
    if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
      playhead.style.marginLeft = newMargLeft + 'px';
    }
    if (newMargLeft < 0) {
      playhead.style.marginLeft = '0px';
    }
    if (newMargLeft > timelineWidth) {
      playhead.style.marginLeft = timelineWidth + 'px';
    }
  }

  function clickPercent(e) {
    return (event.pageX - timeline.offsetLeft) / timelineWidth;
  }
  
  playhead.addEventListener('mousedown', mouseDown, false);
  window.addEventListener('mouseup', mouseUp, false);

  var onplayhead = false;

  function mouseDown() {
    onplayhead = true;
    window.addEventListener('mousemove', moveplayhead, true);
    audio.removeEventListener('timeupdate', timeUpdate, false);
  }

  function mouseUp(e) {
    if (onplayhead == true) {
      moveplayhead(e);
      window.removeEventListener('mousemove', moveplayhead, true);
      audio.currentTime = duration * clickPercent(e);
      audio.addEventListener('timeupdate', timeUpdate, false);
    }
    onplayhead = false;
  }

  function moveplayhead(e) {
    var newMargLeft = e.pageX - timeline.offsetLeft;
    if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
      playhead.style.marginLeft = newMargLeft + 'px';
    }
    if (newMargLeft < 0) {
      playhead.style.marginLeft = '0px';
    }
    if (newMargLeft > timelineWidth) {
      playhead.style.marginLeft = timelineWidth + 'px';
    }
  }

  function timeUpdate() {
    var playPercent = timelineWidth * (audio.currentTime / duration);
    playhead.style.marginLeft = playPercent + 'px';
    if (audio.currentTime == duration) {
      pButton.className = '';
      pButton.className = 'play';
    }
  }

  function play() {
    if (audio.paused) {
      audio.play();
      pButton.className = '';
      pButton.className = 'pause';
    } else {
      audio.pause();
      pButton.className = '';
      pButton.className = 'play';
    }
  }

  audio.addEventListener('canplaythrough', function () {
    duration = audio.duration;  
  }, false);
});

function play_torrent_file(url, title, type, blob) {
  blob['type']=type
  var audio;
  var playlist;
  var tracks;
  var current;
  var pButton = document.getElementById('pButton');
  reader = new FileReader();
  console.log(blob);
  
  reader.onload = function(event) {
    ID3.loadTags(url, function() {
      var tags = ID3.getAllTags(url);
     $('<tr class="file-entry"><td><a href='+url+'>'+tags.artist+'</a></td><td><a href='+url+'>'+tags.title+'</a></td><td><a href='+url+'>'+tags.album+'</a></td></tr>').appendTo('#playlist');

      initPlaylist(tags);
      function initPlaylist(tag){
        current = 0;
        audio = $('#audio')[0];
        playlist = $('#playlist');
        tracks = playlist.find('tr');
        len = tracks.length - 2;
        audio.volume = .70;
        audio.play();
       playlist.find('a').click(function(e){
            e.preventDefault();
            link = $(this);
            current = link.parent().parent().index();
            run(link, audio);
        });
        audio.addEventListener('ended',function(e){
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
        if (pButton.className == "play"){
          pButton.className = "";
          pButton.className = "pause";
        };

        var songArtist = $(link[0]).parent().parent().find('a')[0];
        var songTitle = $(link[0]).parent().parent().find('a')[1];
        var songAlbum = $(link[0]).parent().parent().find('a')[2];
        nowPlaying = $(songArtist).text()+" - "+$(songTitle).text();
        player.src = link.attr('href');
        par = link.parent();
        par.addClass('active-file').siblings().removeClass('active-file');
        player.load();
        player.play();
      }
      
    }, {
      tags: ["title","artist","album","year"],
      dataReader: FileAPIReader(blob)
    });
  };
  reader.readAsArrayBuffer(blob);

}