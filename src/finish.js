var compressors = require('./utils/compressors'),
    shandler = require('./utils/streamhandler'),
    zlib = require('zlib'),
    fs = require('fs')

compressors.identity = function (res, cache, file) {
  var fss = fs.createReadStream(file)
  hstream(cache, file, 'identity', fss)
  fss.pipe(res)
}

module.exports = function (res, code) {
  res.statusCode = code
  res.end()
}

module.exports.send = function (res, cache, file, encoding) {
  res.statusCode = 200
  if(encoding === 'identity') return compressors.identity(res, cache, file)
  var handle = hstream(cache, file, encoding, compressors[encoding](), res)
  fs.createReadStream(file).pipe(handle).pipe(res)
}

module.exports.cached = function (res, cache, headers) {
  res.setHeader('Content-Length', cache.buffer.length)
  res.statusCode = 200
  res.end(cache.buffer)
}