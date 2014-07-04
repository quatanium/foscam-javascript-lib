foscam-javascript-lib
=====================

Foscam Javascript Library for H.264 IP Cameras (FI9821W/P/HD816W/P)

TODO
----
1. Package and upload as a node.js module.
2. Support more camera models.

Requirements
------------
``xml2js`` https://github.com/Leonidas-from-XIV/node-xml2js

``iconv`` https://github.com/ashtuchkin/iconv-lite

Getting Started
---------------
Every function takes a callback function as the last argument.
The callback function is the only way to process results.

### Example
```javascript
    var Foscam = require('Foscam')
    foscam = Foscam.Init('192.168.0.110', 88, 'admin', 'foscam')
    foscam.getIPInfo(function (cmd, result) {
        ip = result.ip;
        mask = result.mask;
        console.log('Command: ' + cmd)
        console.log('IP: ' + ip);
        console.log('Mask: ' + mask);
    });
```
