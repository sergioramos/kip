# kip

## features

 * automatic `content-type` negotiation
 * `gzip`/`deflate` support
 * adjustable `maxage`/`expires`
 * `fs.stat` cached and monitored to update on `fs` changes
 * adjustable file cache size
 * cache monitors file changes and updates his contents
 * content always streamed - except when in cache
 * ignored files (`.gitignore`/`.npmignore` style)
 * middleware compatible
 * cli tool
 
## install
 
```bash
$ npm install [-g] kip
```

use the `-g` option to use it as a cli tool

## cli

```bash
$ kip
```
```bash
Usage:

    kip <root> <options>

Options:

    -c cache size default: 10mb
    -ma maxage/expires default: 0s
```
```bash
$ kip ./public
```
```bash
kip started at http://lvh.me:64761
  -c 10485760b
  -ma 0s
```

## api

### kip(root, opts)
```js
var kip = require('kip')
var file = kip(__dirname, {cache: '10mb', maxage: 3600})

require('http').createServer(function (req, res) {
  file(req, res, function () {
    res.statusCode = 404
    res.end()
  })
}).listen(1337)
```

#### opts
 * **cache**: amount of data (in bytes) stored in the file cache
 * **maxage**: amount of time (in seconds) to set the maxage/expires header

## license
> Copyright (C) 2012 Sérgio Ramos <mail@sergioramos.me>
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.