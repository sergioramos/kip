var watch = require('watch')

module.exports = function (root) {
  return new monitor(root)
}

var monitor = function (path) {
  var on = Object()
  var self = this
  
  on.monitor = function (monitor) {
    monitor.on('created', on.event('created'))
    monitor.on('changed', on.event('changed'))
    monitor.on('removed', on.event('removed'))
  }
  
  on.event = function (name) {
    return function (file, stat) {
      self.emit(name, file, stat)
    }
  }
  
  watch.createMonitor(path, on.monitor)
}

require('util').inherits(monitor, require('events').EventEmitter)