var path = require('path'),
    fs = require('fs'),
    parse = require('url').parse,
    gzip = require('zlib').createGzip,
    mime = require('mime'),
    moment = require('moment'),
    seq = require('seq'),
    interpolate = require('util').format



var respond = {
  empty: function (code, res, callback) { //Forbidden http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.4
    res.statusCode = code
    res.end()
    callback()
  },
  405: function (res, callback) { //Method Not Allowed http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.6
    res.writeHead(405, {Allow: 'GET, HEAD'})
    res.end()
    callback()
  }
}

var sendFile = function (res, file, callback) {
  fs.createReadStream(file).pipe(res).on('finish', callback)
}

var setHeaders = function (res, stat, gzip, file, callback) {
  var contentType = mime.lookup(gzip ? file.slice(0, -3) : file),
      charset = mime.charsets.lookup(contentType, 'UTF-8')

  res.setHeader('Content-Type', contentType + (charset ? '; charset=' + charset : ''))
  gzip ? res.setHeader('Content-Encoding', 'gzip') : null
  res.setHeader('Content-Length', stat.size)
  res.setHeader('Cache-Control', 'max-age=1209600000, private')
  res.setHeader('Last-Modified', stat.mtime.toUTCString())
  res.setHeader('Expires', moment(new Date()).add('w', 2).toDate().toUTCString())
  res.setHeader('Date', new Date().toUTCString())
  sendFile(res, file, callback)
}

var compress = function (file, filegz, res, callback) {
  var pp = fs.createReadStream(file).pipe(gzip()).pipe(fs.createWriteStream(filegz))
  seq()
  .seq(function () {
    pp.on('close', this)
  })
  .seq(fs.stat, filegz, seq)
  .seq(function (gzstat) {
    setHeaders(res, gzstat, true, filegz, callback)
  })
  .catch(function () {
    respond.simple(res, 404, callback)
  })
}

var processGzip = function (file, filegz, rstat, res, callback) {
  fs.stat(filegz, function (e, stat) {
    if((e && e.errno === 34) || (!e && (rstat.ctime > stat.ctime))) return compress(file, filegz, res, callback) //Se não existir, criar um gzip, definir os headers e enviar
    if(e) return respond.empty(404, res, callback) //404
    setHeaders(res, stat, true, filegz, callback)
  }.bind(this))
}

var resolve = function (folder, url, res, callback) { // identifies the full path of the requested file
  var file = parse(path.join(folder, url)).pathname
  if(file.indexOf(folder) !== 0) return respond.empty(403, res, callback)
  return file
}

var filter = function (req, res) { //ensures that the request method is GET or HEAD
  if(req.method !== 'GET' && req.method !== 'HEAD') return respond['405'](res, callback)
  return true;
}

var serve = function (req, res, callback) { //proccess each request
  if(!callback || typeof callback !== 'function') callback = function() {}
  if(!filter(req, res, callback)) return;

  var gzip = !!(req.headers['accept-encoding'] && req.headers['accept-encoding'].indexOf('gzip') !== -1 && this.options.gzip),
      file = resolve(this.folder, req.url, res, callback),
      filegz = interpolate('%s.%s', file, 'gz')

  if(file) fs.stat(file, function(e, stat) {
    if(e) return respond.empty(404, res, callback)
    if(stat.isDirectory()) return respond.empty(403, res, callback)
    if(gzip) return processGzip(file, filegz, stat, res, callback)
    setHeaders(res, stat, false, file, callback)
  }.bind(this))
}

module.exports = function (folder, options) {
  var self = {}  
  self.folder = path.resolve(folder)
  self.options = options || {}
  self.options.expires = self.options.expires || 2629743
  self.options.gzip = (typeof self.options.gzip === 'undefined') ? true : !!self.options.gzip

  if (!self.folder) throw new Error('You need to provide the directory to your static content')
  return serve.bind(self)
}