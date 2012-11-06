module.exports = function (res, stream, cache, encoding, file, callback) {
  var content = Array()
  
  stream.on('data', function (data) {
    content.push(data)
  })
  
  stream.on('end', function () {
    if(callback) return callback(Buffer.concat(content))
    cache.set(encoding, file, Buffer.concat(content))
    res.end()
  })
  
  return stream
}