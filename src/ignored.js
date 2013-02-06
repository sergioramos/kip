var interpolate = require('util').format,
    fstools = require('fs-tools'),
    async = require('async'),
    watch = require('watch'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs')

module.exports = function (root, files, monitor) {
  var on = Object()
  
  on.ignore = function (file, stat, callback) {
    fs.readFile(file, 'utf8', on.patterns(file, stat, callback))
  }
  
  on.patterns = function (file, stat, callback) {
    return function (e, text) {
      if(e) return callback(e)
      var patterns = text.split(/\n/)
      var cwd = file.replace(/.kipignore$/, '')
      async.forEach(patterns, on.pattern(cwd), callback)
    }
  }
  
  on.pattern = function (cwd) {
    var opts = Object()
    opts.root = cwd
    opts.cwd = cwd
    
    return function (pattern, callback) {
      glob(pattern, opts, on.matches(callback))
    }
  }
  
  on.matches = function (callback) {
    return function (e, matches) {
      if(e) return callback(e)
      async.forEach(matches, on.match, callback)
    }
  }
  
  on.match = function (file, callback) {
    file = path.resolve(cwd, file)
    fs.stat(file, on.stat(file, callback))
  }
  
  on.stat = function (file, callback) {
    return function (e, stat) {
      if(e) return callback()
      if(stat.isDirectory()) return on.dir(file, callback)
      files[file] = true
      callback()
    }
  }
  
  on.dir = function (file, callback) {
    fstools.walk(file, on.file, callback)
  }
  
  on.file = function (file, stat, callback) {
    files[file] = true
    callback()
  }
  
  on.monitor = function (file, stat) {
    if(file.match(/.kipignore$/)) return start()
  }
  
  fstools.walk(root, /.kipignore/, on.ignore, function () {})
}