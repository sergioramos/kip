var dosiero = require('../')(__dirname + '/static'),
    http = require('http'),
    fs = require('fs'),
    assert = require('assert'),
    seq = require('seq'),
    request = require('request'),
    moment = require('moment'),
    LoremIpStream = require('loremipstream'),
    buffer = require('buffertools'),
    zlib = require('zlib')



var server = require('http').createServer(function (req, res) {
  dosiero(req, res)
}).listen(1337)

var gzipHeaders = {
  'Accept-Encoding': 'gzip'
}

var trickSeq = function (callback, next) {
  fs.stat(__dirname + '/static/example.js.gz', callback.bind(this, next))
}

var onError = function (e) {
  assert(!e)
}

suite('Codes')

test('403', function (done) {
  seq()
  .par(request.get, 'http://localhost:1337/', seq)
  .par(request.get, 'http://localhost:1337/../index.js', seq)
  .seq(function() {
    assert(arguments[0].statusCode === 403)
    assert(arguments[1].statusCode === 403)
    done()
  })
  .catch(onError)
})

test('404', function (done) {
  seq()
  .par(request.get, 'http://localhost:1337/iindex.js', seq)
  .seq(function() {
    assert(arguments[0].statusCode === 404)
    done()
  })
  .catch(onError)
})

test('405', function (done) {
  seq()
  .par(request.post, 'http://localhost:1337/example.js', seq)
  .par(request.put, 'http://localhost:1337/example.js', seq)
  .seq(function() {
    assert(arguments[0].statusCode === 405)
    assert(arguments[1].statusCode === 405)
    done()
  })
  .catch(onError)
})

suite('Gzip')

test('compress and save', function (done) {  
  seq()
  .seq(trickSeq, function (next, e, stat) {
    assert(e)
    assert(e.errno === 34)
    next()
  }, seq)
  .seq(request.get, {headers: gzipHeaders, url: 'http://localhost:1337/example.js'}, seq)
  .seq(function (res) {
    assert(res.statusCode === 200)
    assert(res.headers['content-encoding'] === 'gzip')
    this()
  })
  .seq(fs.stat, __dirname + '/static/example.js.gz', function (e, stat) {
    assert(!e)
    done()
  })
  .catch(onError)
})

test('content', function (done) {
  var original = fs.readFileSync(__dirname + '/static/example.js', 'utf8'),
      sent = '',
      gunzip = zlib.createGunzip()
  
  gunzip.on('end', function () {
    assert(sent === original)
    done()
  })
  gunzip.on('data', function (data) {
    sent += data
  })
  request.get({headers: gzipHeaders, url: 'http://localhost:1337/example.js'}).pipe(gunzip)
})

test('compress on change', function (done) {
  var lorem = new LoremIpStream({size: Math.floor(Math.random() * (1024 - 256 + 1)) + 256}),
      before

  seq()
  .par(function () {
    before = fs.readFileSync(__dirname + '/static/example.js.gz', 'utf8')
    setTimeout(this, 1000)
  })
  .par(function () {
    lorem.on('end', this)
    lorem.pipe(fs.createWriteStream(__dirname + '/static/example.js'))
  })
  .seq(request.get, {headers: gzipHeaders, url: 'http://localhost:1337/example.js'}, seq)
  .seq(function () {
    var after = fs.readFileSync(__dirname + '/static/example.js.gz', 'utf8')
    assert(before === after)
    done()
  })
  .catch(onError)
})

test('headers', function () {
  request.get({
    headers: gzipHeaders,
    url: 'http://localhost:1337/example.js'
  }, function (e, res) {
    var last_modified = moment(res.headers['last-modified'], 'ddd, DD MMM YYYY'),
        expires = moment(res.headers.expires, 'ddd, DD MMM YYYY'),
        date = moment(res.headers.date, 'ddd, DD MMM YYYY'),
        now = moment(new Date()),
        expectedExpires = moment(new Date()).add('w', 2)
    
    assert(!e)
    assert(res.statusCode === 200)
    assert(res.headers['content-length'])
    assert(res.headers['content-type'] === 'application/javascript; charset=UTF-8')
    assert(res.headers['content-encoding'] === 'gzip')
    assert(res.headers['cache-control'] === 'max-age=1209600000, private')
    assert(res.headers.connection === 'keep-alive')
    assert(last_modified.year() === now.year())
    assert(last_modified.month() === now.month())
    assert(last_modified.day() === now.day())
    assert(date.year() ===  now.year())
    assert(date.month() === now.month())
    assert(date.day() === now.day())
    assert(expires.year() === expectedExpires.year())
    assert(expires.month() === expectedExpires.month())
    assert(expires.day() === expectedExpires.day())
  })
})

suite('Regular')

test('content', function () {
  request.get({headers: gzipHeaders, url: 'http://localhost:1337/example.js'}, function (e, res, body) {
    assert(!e)
    assert(fs.readFileSync(__dirname + '/static/example.js', 'utf8') === body)
  })
})

test('headers', function () {
  request.get('http://localhost:1337/example.js', function (e, res) {
    var last_modified = moment(res.headers['last-modified'], 'ddd, DD MMM YYYY'),
        expires = moment(res.headers.expires, 'ddd, DD MMM YYYY'),
        date = moment(res.headers.date, 'ddd, DD MMM YYYY'),
        now = moment(new Date()),
        expectedExpires = moment(new Date()).add('w', 2)
    
    assert(!e)
    assert(res.statusCode === 200)
    assert(!res.headers['content-encoding'])
    assert(res.headers['content-length'])
    assert(res.headers['content-type'] === 'application/javascript; charset=UTF-8')
    assert(res.headers['cache-control'] === 'max-age=1209600000, private')
    assert(res.headers.connection === 'keep-alive')
    assert(last_modified.year() === now.year())
    assert(last_modified.month() === now.month())
    assert(last_modified.day() === now.day())
    assert(date.year() ===  now.year())
    assert(date.month() === now.month())
    assert(date.day() === now.day())
    assert(expires.year() === expectedExpires.year())
    assert(expires.month() === expectedExpires.month())
    assert(expires.day() === expectedExpires.day())
  })
})

after(function () {
  server.close()
})