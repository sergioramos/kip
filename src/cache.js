var interpolate = require('util').format,
    buffer = require('buffer'),
    zlib = require('zlib'),
    path = require('path'),
    fs = require('fs')

var encodings = Array('gzip', 'deflate', 'compress', 'identity')
var fn = Object()

fn.gzip = zlib.createGzip
fn.compress = zlib.createDeflate
fn.deflate = zlib.createDeflate

var hstream = function (stream, callback) {
  var content = Array()

  stream.on('data', function (data) {
    content.push(data)
  })

  stream.on('end', function () {
    var buf = Buffer.concat(content)
    callback(buf)
  })
}

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

    hstream(stream, function (buf) {
      var entry = cache[encoding][file]
      bl -= entry.length
      entry.buffer = buf
      entry.length = Buffer.byteLength(buf.toString())
      while(bl > limit) reduce()
    })
  }
  
  on.changed = function (file) {
    encodings.forEach(function (encoding) {
      if(cache[encoding][file]) update(encoding, file, fn[encoding])
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
  
  returns.get = function (encoding, file) {
    return cache[encoding][file]
  }
  
  returns.set = function (encoding, file, buffer) {
    if(limit === 0) return
    var entry = Object()
    entry.length = Buffer.byteLength(buffer.toString())
    entry.buffer = buffer
    
    while((entry.length + bl) > limit) reduce()
    
    cache[encoding][file] = entry
    bl += entry.length
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
  
  var ensure = function () {
    if(bl <= limit) return
    
  }
  
  monitor.on('changed', on.changed)
  monitor.on('removed', on.removed)
  
  return returns
}