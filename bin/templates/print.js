require('colors')
var colors = require('./colors.json'),
    hogan = require('hogan.js'),
    path = require('path'),
    fs = require('fs')

hogan.Template.prototype.renderWithColors = function (context, partials, indent) {
  colors.forEach(function (color) {
    context[color] = function (s) { return s[color] }
  })

  return this.ri([context], partials || {}, indent)
}

var files = fs.readdirSync(__dirname).filter(function (file) {
  return path.extname(file).match(/\.handlebars/i)
})

files.forEach(function (file) {
  var template = fs.readFileSync(path.join(__dirname, file), 'utf8')
  var name = path.basename(file).replace(/\.handlebars/, '')
  module.exports[name] = function (context) {
    if(!context) context = {}
    process.stdout.write(hogan.compile(template).renderWithColors(context) + '\n')
  }
})