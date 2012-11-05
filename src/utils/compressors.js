var zlib = require('zlib')

module.exports.gzip = zlib.createGzip
module.exports.compress = zlib.createDeflate
module.exports.deflate = zlib.createDeflate