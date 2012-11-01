var zlib = require('zlib'),
    fs = require('fs')

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

module.exports = function (res, code, headers) {
  res.writeHead(code, headers)
  res.end()
}

module.exports.gzip = function (res, cache, headers, file) {
  res.writeHead(200, headers)
  var handle = hstream(cache, file, 'gzip', zlib.createGzip(), res)
  fs.createReadStream(file).pipe(handle)
}

module.exports.compress = function (res, cache, headers, file) {
  res.writeHead(200, headers)
  var handle = hstream(cache, file, 'compress', zlib.createDeflate())
  fs.createReadStream(file).pipe(handle).pipe(res)
}

module.exports.identity = function (res, cache, headers, file) {
  res.writeHead(200, headers)
  var fss = fs.createReadStream(file)
  hstream(cache, file, 'identity', fsas)
  fss.pipe(res)
}

module.exports.cached = function (res, cache, headers) {
  headers['Content-Length'] = cache.length
  res.writeHead(200, headers)
  zlib.gunzip(cache.buffer, function () {
    console.log(arguments[1].toString())
  })
  res.end(cache.buffer)
}