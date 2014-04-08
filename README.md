foscam-javascript-lib
=====================

Foscam Javascript Library for H.264 IP Cameras (FI9821W/HD816W)

TODO: Package and upload as a node.js module.

Requirement
===========
` xml2js https://github.com/Leonidas-from-XIV/node-xml2js `
` iconv https://github.com/ashtuchkin/iconv-lite`

Getting start
=============
Every method takes a callback function as last parameter. 
The callbacks are the only way to processing results.

### Example
    var Foscam = require('Foscam')
    foscam = Foscam.Init('192.168.0.110', 88, 'admin', 'foscam')
    foscam.getIPInfo(function (cmd, result){
        ip = result.ip;
        mask = result.mask;
        console.log('Execute command: ' + cmd)
        console.log('IP is ' + ip);
        console.log('Mask is ' + mask);
    });

