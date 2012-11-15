var compressors = require('./utils/compressors'),
    shandler = require('./utils/streamhandler'),
    encodings = require('./utils/encodings'),
    interpolate = require('util').format,
    buffer = require('buffer'),
    zlib = require('zlib'),
    path = require('path'),
    fs = require('fs')

module.exports = function (limit, root, monitor) {
  var returns = Object()
  var cache = Object()
  var fifo = Array()
  var on = Object()
  var bl = 0
  
  encodings.forEach(function (encoding) {
    cache[encoding] = Object()
  })
  
  var update = function (encoding, file, stream) {
    if(!stream) stream = fs.createReadStream(file)
    else fs.createReadStream(file).pipe(stream)

    shandler(null, stream, null, null, null, function (buf) {
      var entry = cache[encoding][file]
      bl += entry.length
      entry.buffer = buf
      entry.length = buf.length
      while(bl > limit) reduce()
    })
  }
  
  var reduce = function () {
    var fname = fifo.shift()
    fname = fname.match(/([a-zA-Z]*?) (.*)/)
    var encoding = fname[1]
    var file = path.join(root, fname[2])
    var length = cache[encoding][file].length
    delete cache[encoding][file]
    bl -= length
  }
  
  on.changed = function (file) {
    encodings.forEach(function (encoding) {
      if(cache[encoding][file]) update(encoding, file, compressors[encoding]())
    })
  }
  
  on.removed = function (file) {
    encodings.forEach(function (encoding) {
      if(cache[encoding][file]) {
        bl -= cache[encoding][file].length
        delete cache[encoding][file]
      }
    })
  }
  
  monitor.on('changed', on.changed)
  monitor.on('removed', on.removed)
  
  returns.get = function (encoding, file) {
    return cache[encoding][file]
  }
  
  returns.set = function (encoding, file, buffer) {
    if(limit === 0) return
    var entry = Object()
    entry.length = buffer.length
    entry.buffer = buffer
    
    while((entry.length + bl) > limit) reduce()
    
    cache[encoding][file] = entry
    bl += entry.length
  }
  
  return returns
}