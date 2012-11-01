var bytes = require('bytes'),
    async = require('async'),
    path = require('path'),
    fs = require('fs')

var errs = {
  required: 'path prop is required',
  directory: 'path is not a directory'
}

module.exports.options = function (opts, callback) {
  if(!(opts instanceof Object)) opts = Object()
  
  if(typeof opts.cache !== 'string') opts.cache = '0kb'
  if(typeof opts.cc !== 'string') opts.cc = 'etags'
  opts.cache = bytes(opts.cache)
  
  return opts
}

module.exports.root = function (root) {
  root = path.resolve(root)
  
  stat(root, function (e, stat) {
    if(e) throw e
    if(!stat.isDirectory()) throw new Error(errs.directory)
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