var fstools = require('fs-tools'),
    path = require('path')

var noop = function () {}

module.exports = function (root, monitor) {
  var files = Object()
  
  monitor.on('created', function (file, stat) {
    if(!stat.isDirectory()) files[file] = stat
  })
  
  monitor.on('removed', function (file) {
    if(files[file]) files[file] = false
  })
  
  setInterval(function () {
    Object.keys(files).forEach(function (file) {
      if(!files[file]) delete files[file]
    })
  }, 3600)
  
  fstools.walk(root, function (file, stat, callback) {
    if(!stat.isDirectory()) files[file] = stat
    callback()
  }, noop)
  
  return files
}