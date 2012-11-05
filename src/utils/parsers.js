var errors = require('./errors'),
    bytes = require('bytes'),
    async = require('async'),
    path = require('path'),
    fs = require('fs')

module.exports.options = function (opts, callback) {
  if(!(opts instanceof Object)) opts = Object()
  if(typeof opts.maxage !== 'number') opts.maxage = 0
  if(typeof opts.cache !== 'string') opts.cache = '0kb'
  opts.cache = bytes(opts.cache)
  return opts
}

module.exports.root = function (root) {
  root = path.resolve(root)
  
  stat(root, function (e, stat) {
    if(e) throw e
    if(!stat.isDirectory()) throw new Error(errors.directory)
  })
  
  return root
}

var stat = function (path, callback) {
  var e = null
  
  try {
    var stat = fs.statSync(path)
  } catch (err) {
    e = err
  } finally {
    callback(e, stat)
  }
}