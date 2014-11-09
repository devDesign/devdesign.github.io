var sound;
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
    sound = new Howl({
      urls: [audio.src],
      format: 'mp3'
    }).play();
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