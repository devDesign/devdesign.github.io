var ctx = new AudioContext();
var loader = require('webaudio-buffer-loader');
var buffers = sounds;

$('#webaudio').on('click',function(e){
  loader(buffers, ctx, function(err, loadedBuffers) {
    loadedBuffers[0].noteOn(0);
  });
});
