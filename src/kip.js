var Negotiator = require('negotiator').Negotiator,
    Monitor = require('./monitor'),
    ignored = require('./ignored'),
    parse = require('./parsers'),
    Cache = require('./cache'),
    finish = require('./finish'),
    mime = require('mime'),
    Map = require('./map'),
    path = require('path'),
    url = require('url'),
    fs = require('fs')

module.exports = function () {
  var opts = Object()
  var root = '.'
    
  if(typeof arguments[0] === 'object') opts = arguments[0]
  else { root = arguments[0]; opts = arguments[1] }
  
  return kip(parse.root(root), parse.options(opts))
}

var kip = function (root, opts) {
  var monitor = Monitor(root)
  var cache = Cache(opts.cache, root, monitor)
  var igfiles = Object()
  var filter = Object()
  var which = Object()
  var map = Map(root, monitor)
  
  ignored(root, igfiles, monitor)
  
  which.file = function () {
    return path.join(root, decodeURI(url.parse(arguments[0]).pathname))
  }
  
  which.encoding = function (req) {
    var negotiator = new Negotiator(req)
    return negotiator.preferredEncoding(Array('gzip', 'compress', 'identity'))
  }
    
  filter.method = function (req, res) {
    var allowed = req.method.match(/get/i) || req.method.match(/head/i)
    if(allowed) return true
    finish(res, 405, {'Allow': 'GET, HEAD'})
    return false
  }
  
  filter.ignored = function (file, res) {
    var ignored = igfiles[file]
    if(!ignored) return true
    finish(res, 403, Object())
    return false
  }
  
  return function (req, res, next) {
    var file = which.file(req.url)
    var stat = map[file]
    if(!stat) return next()
    if(!filter.method(req)) return
    if(!filter.ignored(file)) return
    
    var cmtime = Date.parse(req.headers['if-modified-since'])
    var cetag = req.headers['if-none-match']
    var mtime = Date.parse(stat.mtime)
    var headers = Object()
    var cmatch = Object()
        
    headers['ETag'] = [stat.ino, stat.size, mtime].join('-').toString()
    headers['Last-Modified'] = new Date(stat.mtime).toUTCString()
    headers['Date'] = new Date().toUTCString()
        
    cmatch.customer = cmtime || cetag
    cmatch.etag = !cetag || cetag === headers.ETag
    cmatch.mtime = !cmtime || cmtime >= mtime
    
    console.log(cetag, cmtime)
    if(cmatch.customer && cmatch.etag && cmatch.mtime) return finish(res, 304, headers)
    
    var ctype = mime.lookup(file)
    var charset = mime.charsets.lookup(ctype, 'UTF-8')
    var encoding = which.encoding(req)
    
    headers['Content-Type'] = ctype + (charset ? '; charset=' + charset : '')
    headers['Content-Encoding'] = encoding
    headers['Vary'] = 'Accept-Encoding'
//    res.setHeader('Cache-Control', 'max-age=1209600000, private')
//    res.setHeader('Expires', moment(new Date()).add('w', 2).toDate().toUTCString())
    
    if(req.method === 'HEAD') return finish(res, 200, headers)
    
    var cached = cache.get(encoding, file)
    if(cached) return finish.cached(res, cached, headers)
    
    finish[encoding](res, cache, headers, file)
  }
}