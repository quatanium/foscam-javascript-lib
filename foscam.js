var http = require('http'),
    querystring =require('querystring'),
    xml2js = require('xml2js');
    iconv = require('iconv-lite');

var parser = new xml2js.Parser();


// Implemention of format.
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
            ;
         });
    };
};


var Foscam = {
    // A JavaScript implementation of the foscam HD816W
    // e.g.
    //    foscam = Foscam.Init('host', port, 'username', 'password')
    //    foscam.getIPInfo(console.log);

    Init: function(host, port, usr, pwd) {
        // Initialize
        var foscam = { };
        foscam.host = host;
        foscam.port = port;
        foscam.usr = usr;
        foscam.pwd = pwd;

        // Get camera's url.
        foscam.url = function() {
            return "/cgi-bin/CGIProxy.fcgi?usr={2}&pwd={3}".format(foscam.host, foscam.port, foscam.usr, foscam.pwd);
        };

        // Encode object into url string.
        foscam.executeCommand= function(cmd, params, callback) {
            // Send cmd to foscam.
            var paramstr = '';
            if (params && 'devName' in params) {
                paramstr = 'devName=' + encodeURIComponent_GBK(params.devName);
            } else {
                paramstr = querystring.stringify(params);
            }
            if(paramstr) {
                paramstr = '&' + paramstr;
            }

            op = {
                host: foscam.host,
                port: foscam.port,
                method: 'GET',
                path: "{0}&cmd={1}{2}".format(foscam.url(), cmd, paramstr),
                headers: {
                    'Accept': 'text/html'
                }
            };

            result = '';
            var req = http.request(op, function(response) {

                // response
                response.setEncoding('utf8');
                var data = '';

                response.on( 'data', function(chunk) { data += chunk; });
                response.on( 'end', function() {
                    data = data.trim();

                    // parser xml to json
                    var parxml = '';
                    parser.on('end', function(result) {
                        parxml = result;
                    });
                    parser.parseString(data);
                    parser.reset();
                    if ( typeof callback == 'function') { callback(cmd, parxml.CGI_Result); }
                    result = parxml.CGI_Result;
                });// on end

            });// request

            req.on( 'error', function( err ) {
                console.log( 'Connection-error:' + err );
            });

            req.end();

            return result;

        }; // executeCommand


        // *************************** Network ************************************
        foscam.getIPInfo = function(callback) {
            // Get IP infoamtion.
            return foscam.executeCommand('getIPInfo', null, callback);
        };

        foscam.setIpInfo = function(isDHCP, ip, gate, mask, dns1, dns2, callback) {
            //isDHCP: 0(False), 1(True)
            //System will reboot automatically to take effect after call this CGI command.
            var params = {
                          'isDHCP': isDHCP,
                          'ip': ip,
                          'gate': gate,
                          'mask': mask,
                          'dns1': dns1,
                          'dns2': dns2,
            };

            return foscam.executeCommand('setIpInfo', params, callback);
        };

        foscam.setPortInfo = function(webPort, mediaPort, httpsPort, onvifPort, callback) {
            //Set http port and media port of camera.
            var params = {
                          'webPort'   : webPort,
                          'mediaPort' : mediaPort,
                          'httpsPort' : httpsPort,
                          'onvifPort' : onvifPort,
            };
            return foscam.executeCommand('setPortInfo', params, callback);
        };

        foscam.refreshWifiList = function(callback) {
            //Start scan the aps around.
            //This operation may takes a while, about 20s or above,
            //the other operation on this device will be blocked during the period.
            return foscam.executeCommand('refreshWifiList', null, callback);
        };

        foscam.getWifiList = function(startNo, callback) {
            //Get the aps around after refreshWifiList.
            //Note: Only 10 aps will be returned one time.
            params = {'startNo': startNo};
            return foscam.executeCommand('getWifiList', params, callback);
        };

        foscam.setWifiSetting = function(ssid, psk, isEnable, isUseWifi, netType,
                            encrypType, authMode, keyFormat, defaultKey,
                            key1, key2, key3, key4,
                            key1Len, key2Len, key3Len, key4Len, callback) {
            //Set wifi config.
            //Camera will not connect to AP unless you enject your cable.
            params = {'isEnable'   : isEnable,
                      'isUseWifi'  : isUseWifi,
                      'ssid'       : ssid,
                      'netType'    : netType,
                      'encryptType': encrypType,
                      'psk'        : psk,
                      'authMode'   : authMode,
                      'keyFormat'  : keyFormat,
                      'defaultKey' : defaultKey,
                      'key1'       : key1,
                      'key2'       : key2,
                      'key3'       : key3,
                      'key4'       : key4,
                      'key1Len'    : key1Len,
                      'key2Len'    : key2Len,
                      'key3Len'    : key3Len,
                      'key4Len'    : key4Len,
                      };
            return foscam.executeCommand('setWifiSetting', params, callback);
        };

        foscam.getUPnPConfig = function(callback) {
            return foscam.executeCommand( 'getUPnPConfig', null, callback );
        };

        foscam.setUPnPConfig = function(isEnable, callback) {
            params = {'isEnable': isEnable};
            return foscam.executeCommand('setUPnPConfig', params, callback);
        };

        foscam.getDDNSConfig = function(callback) {
            return foscam.executeCommand('getDDNSConfig', null, callback);
        };

        foscam.setDDNSConfig = function(isEnable, hostName, ddnsServer, user, password, callback) {
            params = {'isEnable': isEnable,
                      'hostName': hostName,
                      'ddnsServer': ddnsServer,
                      'user': user,
                      'password': password,
                     };
            return foscam.executeCommand('setDDNSConfig', params, callback);
        };

        // *************** AV Settings  ******************
        foscam.getSubVideoStreamType = function(callback) {
            //Get the stream type of sub stream.
            return foscam.executeCommand('getSubVideoStreamType', null, callback);
        };

        foscam.setSubVideoStreamType = function(format, callback) {
            params = {'format': format};
            return foscam.executeCommand('setSubVideoStreamType', params, callback);
        };

        foscam.setSubStreamFormat = function(format, callback) {
            params = {'format': format};
            return foscam.executeCommand('setSubStreamFormat', params, callback);
        };

        foscam.getMainVideoStreamType = function(callback) {
            return foscam.executeCommand('getMainVideoStreamType', null, callback);
        };

        foscam.setMainVideoStreamType = function(streamType, callback) {
            //Set the stream type of main stream
            params = {'streamType': streamType};
            return foscam.executeCommand('setMainVideoStreamType', params, callback);
        };

        foscam.getVideoStreamParam = function(callback){
            //Get video stream param
            return foscam.executeCommand('getVideoStreamParam', null, callback);
        };

        foscam.setVideoStreamParam = function(streamType, resolution, bitRate,
            frameRate, GOP, isVBR, callback) {
            //Set the video stream param of stream N
            //resolution(0~4): 0 720P,
            //                 1 VGA(640*480),
            //                 2 VGA(640*360),
            //                 3 QVGA(320*240),
            //                 4 QVGA(320*180)
            //bitrate: Bit rate of stream type N(20480~2097152)
            //framerate: Frame rate of stream type N
            //GOP: P frames between 1 frame of stream type N.
            //     The suggest value is: X * framerate.
            //isvbr: 0(Not in use currently), 1(In use)
            params = {'streamType': streamType,
                      'resolution': resolution,
                      'bitRate'   : bitRate,
                      'frameRate' : frameRate,
                      'GOP'       : GOP,
                      'isVBR'     : isVBR,
                     };
            return foscam.executeCommand('setVideoStreamParam', params, callback);
        };


        // *************** User account ******************
        foscam.changeUserName = function(usrName, newUsrName, callback) {
            // Change user name.
            params = {
                      'usrName': usrName,
                      'newUsrName': newUsrName,
            };
            return foscam.executeCommand('changeUserName', params, callback);
        };


        foscam.changePassword = function(usrName, oldPwd, newPwd, callback) {
            // Change password.
            params = {
                      'usrName': usrName,
                      'oldPwd' : oldPwd,
                      'newPwd' : newPwd,
            };
            return foscam.executeCommand('changePassword', params, callback);
        };


        // *************** Device manage *******************

        foscam.setSystemTime = function(ntpServer, callback) {
            // Only support timeSource = 0(Get time from NTP server)
            // Supported ntpServer 'time.nist.gov',
            //                      'time.kriss.re.kr',
            //                      'time.windows.com',
            //                      'time.nuri.net',
            params = {'timeSource': 0, 'ntpServer': ntpServer};
            return foscam.executeCommand('setSystemTime', params, callback);
        };

        foscam.getSystemTime = function(callback) {
            // Get system time.
            return foscam.executeCommand('getSystemTime', null, callback);
        };

        foscam.getDevName = function(callback) {
            //Get camera name.
            return foscam.executeCommand('getDevName', null, callback);
        };

        foscam.setDevName = function(devName, callback){
            // Set camera name
            params = {'devName': devName};
            return foscam.executeCommand('setDevName', params, callback);
        };

        foscam.getDevState = function(callback) {
            return foscam.executeCommand('getDevState', null, callback);
        };


        // *************** PTZ Control *******************

        foscam.ptzMoveUp = function(callback) {
            return foscam.executeCommand('ptzMoveUp', null, callback);
        };

        foscam.ptzMoveDown = function(callback) {
            return foscam.executeCommand('ptzMoveDown', null, callback);
        };

        foscam.ptzMoveLeft = function(callback) {
            return foscam.executeCommand('ptzMoveLeft', null, callback);
        };

        foscam.ptzMoveRight = function(callback) {
            return foscam.executeCommand('ptzMoveRight', null, callback);
        };

        foscam.ptzMoveTopLeft = function(callback) {
            return foscam.executeCommand('ptzMoveTopLeft', null, callback);
        };

        foscam.ptzMoveTopRight = function(callback) {
            return foscam.executeCommand('ptzMoveTopRight', null, callback);
        };

        foscam.ptzMoveBottomLeft = function(callback) {
            return foscam.executeCommand('ptzMoveBottomLeft', null, callback);
        };

        foscam.ptzMoveBottomRight = function(callback) {
            return foscam.executeCommand('ptzMoveBottomRight', null, callback);
        };

        foscam.ptzStopRun = function(callback) {
            return foscam.executeCommand('ptzStopRun', null, callback);
        };

        foscam.ptzReset = function(callback) {
            return foscam.executeCommand('ptzReset', null, callback);
        };

        foscam.getPTZSpeed = function(callback) {
            return foscam.executeCommand('getPTZSpeed', null, callback);
        };

        foscam.setPTZSpeed = function(speed, callback) {
            params = {'speed': speed};
            return foscam.executeCommand('setPTZSpeed', params, callback);
        };

        foscam.getPTZSelfTestMode = function(callback) {
            return foscam.executeCommand('getPTZSelfTestMode', null, callback);
        };

        foscam.setPTZSelfTestMode = function(mode, callback) {
            //Set the selftest mode of PTZ
            //mode = 0: No selftest
            //mode = 1: Normal selftest
            //mode = 1: After normal selftest, then goto presetpoint-appointed
            params = {'mode': mode}
            return foscam.executeCommand('setPTZSelfTestMode', params, callback);
        };


        // *************** AV Function *******************
        foscam.getAlarmRecordConfig = function(callback) {
            // Get alarm record config
            return foscam.executeCommand('getAlarmRecordConfig', null, callback);
        };

        foscam.setAlarmRecordConfig = function(isEnablePreRecord, preRecordSecs, alarmRecordSecs, callback) {
            // Set alarm record config
            params = {'isEnablePreRecord': isEnablePreRecord,
                      'preRecordSecs'    : preRecordSecs,
                      'alarmRecordSecs'  : alarmRecordSecs,
                     };
            return foscam.executeCommand('setAlarmRecordConfig', params, callback);
        };

        foscam.getLocalAlarmRecordConfig = function(callback) {
            // Get local alarm-record config
            return foscam.executeCommand('getLocalAlarmRecordConfig', null, callback);
        };

        foscam.setLocalAlarmRecordConfig = function(isEnableLocalAlarmRecord, localAlarmRecordSecs, callback) {
            // Set local alarm-record config
            params = {'isEnableLocalAlarmRecord': isEnableLocalAlarmRecord,
                      'localAlarmRecordSecs'    : localAlarmRecordSecs
                     };
            return foscam.executeCommand('setLocalAlarmRecordConfig', params, callback);
        };

        foscam.getH264FrmRefMode = function(callback) {
            // Get grame shipping reference mode of H264 encode stream.
            // Return args:
            //        mode: 0 Normal reference mode
            //              1 Two frames are seprated by four skipping frames
            return foscam.executeCommand('getH264FrmRefMode', null, callback);
        };

        foscam.setH264FrmRefMode = function(mode, callback) {
            // Set frame shipping reference mode of H264 encode stream.
            params = {'mode': mode};
            return foscam.executeCommand('setH264FrmRefMode', params, callback);
        };

        foscam.getScheduleRecordConfig = function(callback) {
            // Get schedule record config.
            // cmd: getScheduleRecordConfig
            // Return args:
            //         isEnable: 0/1
            //         recordLevel: 0 ~ ?
            //         spaceFullMode: 0 ~ ?
            //         isEnableAudio: 0/1
            //         schedule[N]: N <- (0 ~ 6)
            return foscam.executeCommand('getScheduleRecordConfig', null, callback);
        };

        foscam.setScheduleRecordConfig = function(isEnable, recordLevel,
                                   spaceFullMode, isEnableAudio,
                                   schedule0, schedule1, schedule2,
                                   schedule3, schedule4, schedule5,
                                   schedule6, callback) {
            // Set schedule record config.
            // cmd: setScheduleRecordConfig
            // args: See meth::getScheduleRecordConfig
            params = {'isEnable'     : isEnable,
                      'isEnableAudio': isEnableAudio,
                      'recordLevel'  : recordLevel,
                      'spaceFullMode': spaceFullMode,
                      'schedule0'    : schedule0,
                      'schedule1'    : schedule1,
                      'schedule2'    : schedule2,
                      'schedule3'    : schedule3,
                      'schedule4'    : schedule4,
                      'schedule5'    : schedule5,
                      'schedule6'    : schedule6,
                      };

            return foscam.executeCommand('setScheduleRecordConfig', params, callback);
        }

        foscam.getRecordPath = function(callback){
            // Get Record path: sd/ftp
            // cmd: getRecordPath
            // return args:
            //     path: (0,SD), (1, FTP)
            //     free: free size(K)
            //     total: total size(K)
            return foscam.executeCommand('getRecordPath', null, callback);
        };

        return foscam;
    }
};

function encodeURIComponent_GBK(str) {
    if(str==null || typeof(str)=='undefined' || str=='')
        return '';

    var a = str.toString().split('');

    for(var i=0; i<a.length; i++) {
        var ai = a[i];
        if( (ai>='0' && ai<='9') || (ai>='A' && ai<='Z') || (ai>='a' && ai<='z') || ai==='.' || ai==='-' || ai==='_') continue;
        var b = iconv.encode(ai, 'gbk');
        var e = [''];
        for(var j = 0; j<b.length; j++)
            e.push( b.toString('hex', j, j+1).toUpperCase() );
        a[i] = e.join('%');
    }
    return a.join('');
};

exports.Foscam = Foscam;

