var zlib = require('zlib'),
    fs = require('fs')

var fn = Object()

fn.identity = function (res, cache, file) {
  var fss = fs.createReadStream(file)
  hstream(cache, file, 'identity', fss)
  fss.pipe(res)
}

fn.gzip = zlib.createGzip
fn.compress = zlib.createDeflate
fn.deflate = zlib.createDeflate

var hstream = function (cache, file, encoding, stream, res) {
  var content = Array()
  
  stream.on('data', function (data) {
    content.push(data)
  })
  
  stream.on('end', function () {
    var buff = Buffer.concat(content)
    cache.set(encoding, file, buff)
    res.end()
  })
  
  return stream
}

module.exports = function (res, code) {
  res.statusCode = code
  res.end()
}

module.exports.send = function (res, cache, file, encoding) {
  res.statusCode = 200
  if(encoding === 'identity') return fn.identity(res, cache, file)
  var handle = hstream(cache, file, encoding, fn[encoding](), res)
  fs.createReadStream(file).pipe(handle).pipe(res)
}

module.exports.cached = function (res, cache, headers) {
  res.setHeader('Content-Length', cache.length)
  res.statusCode = 200
  res.end(cache.buffer)
}