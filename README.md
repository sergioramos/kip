# dosiero

Node.js HTTP streaming static server

### api

    var dosiero = require('../')(__dirname + '/static'),
        http = require('http')
    
    var server = require('http').createServer(function (req, res) {
      dosiero(req, res)
    }).listen(6338)

### install

    npm install dosiero
    
### test
    
    npm test
    
### license
MIT