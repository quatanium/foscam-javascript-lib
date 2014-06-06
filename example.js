var FoscamModule = require('./foscam.js');

HOST = '';
PORT = '';
USER = '';
PASS = '';

function check(cmd, result) {
    if( result && result.result == '0' ) {
        console.log('TEST ' + cmd + '............ OK');
    } else {
        console.log('TEST ' + cmd + '............ Failed');
    };
};

mycam = FoscamModule.Foscam.Init(HOST, PORT, USER, PASS);

mycam.getAlarmRecordConfig(check);

mycam.getLocalAlarmRecordConfig(check);

mycam.getH264FrmRefMode(check);

mycam.getScheduleRecordConfig(check);
