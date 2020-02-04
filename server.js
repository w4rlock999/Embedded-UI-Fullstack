const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const port = process.env.PORT || 5000;
const index = require("./routes/index");

const drivelist = require('drivelist');
const diskusage = require('diskusage');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;

const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const ekf_nav = rosnodejs.require('sbg_driver').msg;
const sensor_msgs = rosnodejs.require('sensor_msgs').msg;

var psTree = require('ps-tree');
const fs = require('fs-extra'); 

var routineLog = require('debug')('routine');
var processLog = require('debug')('process');

//=======
//=======

const app = express();
app.use(index);
const server = http.createServer(app);
const io = socketIo(server);
//===========================================================
//===========================================================


//todo set to node_env

var pathToProject = "/home/w4rlock999/oneMap-Project/";     //to develop
var pathToApp = "/home/w4rlock999/Workspace/web/onemap-fullstack";  //to develop
var pathToCopyDst = "/home/w4rlock999/cobaCopyDisini/"
// var pathToProject = "/home/rekadaya/oneMap-Project/";       //to deploy
// var pathToApp = "/home/rekadaya/ui_dir/onemap-fullstack";   //to deploy

var serverState = {
    processRunning: false,
    gpsPositionOK: false,
    lidarDataOK: false,
    PPKprocess: false,
    runPPKLogger: false,
    recordPPKdata: false,
    RTKprocess: false,
    runTrajectoryLogger: false,
    runLidarMapper: false,
    recordMapperPoints: false,
    recordBag: false,
    magnetoCalib: "not ready",
};

var clientRequest = {
    projectName: "",
    saveTo: "",
    recordBag: true,
    RTKprocess: true,
    PPKprocess: false,
};

let childRoscore;
let childBagPlayer;
let childMagnetoCalibLauncher;
let childMagnetoCalibStart;
let childMagnetoCalibSave;
let childSensorsLauncher;
let childTrajectoryLogger;
let childLidarMapping;
let childRecordMapperPoints;
let childRecordBag;
let childPPKLogger;
let childRecordPPKdata;
let childToPCD;
let childShutdown;

var driveNum;
var driveInit;
var rmvableD_status = false;
var rmvableD_object = {
    name: "",
    mountPoint: "",
    freeSpace: 0.0,
    totalSpace: 0.0,
};
var rmvableD_index;
var drives;

var prevLidarDataOK = false;
var prevGpsPositionOK = false;

var connectedClient = 0;

var date = new Date();
var current_hours = date.getHours();
var current_minute = date.getMinutes();

var feedMessages = [{"text":"Tap on floating icon to start mapping.", 
                     "time":( (current_hours<10)?`0${current_hours}`:`${current_hours}`) + (`:`) 
                            + ((current_minute<10)?`0${current_minute}`:`${current_minute}`)}];

var backendMsgFileDir = '../backendMsg.json';
fs.writeFile(backendMsgFileDir, JSON.stringify(feedMessages, null, 2), function (err){
    if(err) return processLog(err);
    processLog("writing initial message file");
});

function pushFeedMessage (newMessage) {
    
    var newDate = new Date();
    
    current_hours = newDate.getHours();
    current_minute = newDate.getMinutes();
    
    newMessage["time"] = ( (current_hours<10)?`0${current_hours}`:`${current_hours}`) + (`:`) 
                            + ((current_minute<10)?`0${current_minute}`:`${current_minute}`);
    
    feedMessages.unshift(newMessage);
    fs.writeFile(backendMsgFileDir, JSON.stringify(feedMessages, null, 2), function (err){
        if(err) return processLog(err);
        processLog("writing to log file");
    });
} 

var kill = function (pid, signal, callback) {
    signal = signal || 'SIGINT'
    callback = callback || function () {};
    var killTree = true;
    if (killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};

const driveStart = async function(){
    drives = await drivelist.list();
    driveInit = drives.length;
    processLog("initializing read drives....");
    processLog(drives.length);
}

const driveRead = async function(){
    drives = await drivelist.list();
    processLog("read drives....");
    processLog(drives);
    processLog(drives.length);
    return drives.length;
}

driveStart();

if (require.main === module) {
    ros_topics_listener();   
}

io.on("connection", socket => {
    
    routineLog("New client connected");

    //======================= Main Process Handler =====================================
    //==================================================================================

    socket.on("clientRequest", data => { clientRequestCallback(data, socket) });
    socket.on("processStart", data => { processStartCallback(data, socket) });



    //=============== POWER Operation HANDLER ==========================================
    //==================================================================================

    socket.on("shutdown", data => { shutdownCallback(data, socket) });
    socket.on("restart", data => { restartCallback(data, socket) });


    //========================= Removable Disk Handler =================================
    //==================================================================================

    socket.on("rmvableDEject", data => { rmvableDEjectCallback(data, socket) });
    socket.on("rmvableDCheck", data => { rmvableDCheckCallback(data, socket) });    


    //======================= Project Folder Handler ===================================
    //==================================================================================

    projectFolderCheck(socket);
    socket.on("clientFolderRead", data => { clientFolderReadCallback(data, socket) });
    socket.on("copyProject", data => { copyProjectCallback(data, socket) });
    socket.on("deleteProject", data => { deleteProjectCallback(data, socket) });


    //======================= Magneto Calib Handler ====================================
    //==================================================================================

    socket.on("magnetoCalibLaunch", data => { magnetoCalibLaunchCallback(data, socket) });
    socket.on("magnetoCalibStart", data => { magnetoCalibStartCallback(data, socket) });
    socket.on("magnetoCalibSave", data => { magnetoCalibSaveCallback(data, socket) });


    //==================================================================================

    if(connectedClient == 0){
        setInterval( ()=>timerCallback(socket),1000);
        connectedClient=connectedClient+1;
    } else {
        connectedClient=connectedClient+1;
    }

    socket.on("disconnect", () => routineLog("client disconnected"));
});

const timerCallback = async socket => {

    try {
        socket.emit("serverMessage", feedMessages);
        socket.broadcast.emit("serverMessage", feedMessages);

        socket.emit("processRunning", serverState.processRunning);
        socket.broadcast.emit("processRunning", serverState.processRunning);

        routineLog("timer callback 1000ms");
    } catch (error) {
        routineLog(`Error: ${error.code}`);
    }

    //============= monitor sensors data lost ========
    //================================================
    if(!prevLidarDataOK && serverState.lidarDataOK){
        pushFeedMessage({"text":"Lidar data OK!"});
    }

    if(!prevGpsPositionOK && serverState.gpsPositionOK){
        pushFeedMessage({"text":"GPS Position OK!"});
    }

    //============= main sequence process =============
    //=================================================
    if(serverState.lidarDataOK && serverState.gpsPositionOK){

        processLog("position OK, Lidar OK, Now start main process");
        
        if(clientRequest.RTKprocess && !clientRequest.PPKprocess){                          //RTK main process
      
            if(!serverState.runTrajectoryLogger){

                childTrajectoryLogger = exec(`rosrun trajectory_logger trajectory_logger 0`,{
                    silent: true, 
                    async: true
                });
                processLog("start logging");
                pushFeedMessage({"text":"Trajectory Logger running..."});
                serverState.runTrajectoryLogger = true;
            }
            if(!serverState.runLidarMapper){
    
                childLidarMapping = exec('rosrun trajectory_logger lidar_mapper',{
                    silent: true, 
                    async: true
                }); 
                processLog("start mapper");
                pushFeedMessage({"text":"Mapper running..."});
                serverState.runLidarMapper = true;
            }
    
            if(!serverState.recordMapperPoints){
    
                childRecordMapperPoints = exec(`bash ${pathToApp}/rtmapping.bash ${clientRequest.projectName}`,{
                    silent: true, 
                    async: true
                });
                pushFeedMessage({"text":"Recording mapped data"});
                serverState.recordMapperPoints = true;
            }    
            
        }else if(!clientRequest.RTKprocess && clientRequest.PPKprocess){                    //PPK main process

            if(!serverState.runPPKLogger){

                childPPKLogger = exec('rosrun trajectory_logger ppk_logger 0',{
                    silent: true,
                    async: true
                });
                processLog("start ppk logger");
                pushFeedMessage({"text":"PPK Logger Running"});
                serverState.runPPKLogger = true;
            }

            if(!serverState.recordPPKdata){
                
                childRecordPPKdata = exec(`bash ${pathToApp}/ppkData.bash ${clientRequest.projectName}`,{
                    silent: true,
                    async: true
                });
                pushFeedMessage({"text":"Recording PPK data"});
                serverState.recordPPKdata = true;
            }

        }else{
            processLog("client request not valid");
        }

        if(clientRequest.recordBag && !serverState.recordBag){
    
            childRecordBag = exec(`bash ${pathToApp}/record.bash ${clientRequest.projectName}`,{
                silent: true, 
                async: true
            });
            pushFeedMessage({"text":"Recording bag file"});
            serverState.recordBag = true;
        }

    }else{
        routineLog("system not ready, missing some topic(s)");
    }

    prevLidarDataOK = serverState.lidarDataOK;
    prevGpsPositionOK = serverState.gpsPositionOK;
};

function ros_topics_listener() {

    rosnodejs.initNode('/server_listener_node')
      .then((rosNode) => {
        
        
        //================= Check if sensors data are ready ======================
        //========================================================================

        let ekf_nav_sub = rosNode.subscribe('/ekf_nav', ekf_nav.SbgEkfNav,
          (data) => { 
        
            if(data.status.gps1_pos_used && !serverState.gpsPositionOK && serverState.processRunning){
                serverState.gpsPositionOK = true;    
                rosnodejs.log.info('Status gps position is True!');
            }else //below cannot be executed on roscore termination bcs no incoming data after. 
            if(!data.status.gps1_pos_used && serverState.gpsPositionOK && serverState.processRunning){
                serverState.gpsPositionOK = false;    
                rosnodejs.log.info('Status gps position is False!');
            }
          }
        );

        let velodyne_points_sub = rosNode.subscribe('/velodyne_points', sensor_msgs.PointCloud2,
          (data) => {  
            if(!serverState.lidarDataOK && serverState.processRunning){
                serverState.lidarDataOK = true;
                rosnodejs.log.info('lidar data OK!');
            }    
          }
        );
      });
};

const clientRequestCallback = (data, socket) => {
    clientRequest = data;
    processLog(`params received`);

    processLog(`project name ${clientRequest.projectName}`);
    processLog(`save to ${clientRequest.saveTo}`);
    processLog(`record bag ${clientRequest.recordBag}`);
    processLog(`RTK mapping ${clientRequest.RTKprocess}`);
    processLog(`PPK mapping ${clientRequest.PPKprocess}`);
}

const processStartCallback = (data, socket) => {

    if(data == true) {

        processLog("client send processStart: " + data);

        // childBagPlayer = exec('rosbag play /home/rekadaya//Downloads/2019-04-12-21-02-09.bag --clock',{
        //     silent: true, 
        //     async: true
        // });

        childSensorsLauncher = exec('roslaunch trajectory_logger devices.launch',{
            silent: true,
            async: true
        });

        pushFeedMessage({"text": "PROCESS STARTED for "+ clientRequest.projectName +""});
        serverState.processRunning = true;
     
    }else{

        processLog("client terminated process, processStart: " + data);
        serverState.processRunning = false;

        if(clientRequest.RTKprocess && !clientRequest.PPKprocess){                      //RTK stop process
            
            if(serverState.recordMapperPoints) kill(childRecordMapperPoints.pid);
            if(serverState.recordBag) kill(childRecordBag.pid);            
            if(serverState.runLidarMapper) kill(childLidarMapping.pid, 'SIGINT');
            if(serverState.runTrajectoryLogger) kill(childTrajectoryLogger.pid);

            if(serverState.recordMapperPoints){
                childToPCD = exec(`bash ${pathToApp}/topcd.bash ${clientRequest.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runTrajectoryLogger = false;
                    serverState.runLidarMapper = false;
                    pushFeedMessage({"text": "Export to PCD, done!"});
                });
            }else{
                exec(`bash ${pathToApp}/nopcd.bash ${clientRequest.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runTrajectoryLogger = false;
                    serverState.runLidarMapper = false;
                    pushFeedMessage({"text": "No data mapped"});
                });
            }

            kill(childSensorsLauncher.pid, 'SIGINT', function() {
            // kill(childBagPlayer.pid, 'SIGINT', function() {

                pushFeedMessage({"text": "RTK process stopped"});    
                
                serverState.gpsPositionOK = false;
                serverState.lidarDataOK = false;
                serverState.recordBag = false;
                serverState.recordMapperPoints = false;
            });     

        }else if(!clientRequest.RTKprocess && clientRequest.PPKprocess){                //PPK stop process
            
            if(serverState.recordPPKdata) kill(childRecordPPKdata.pid)
            if(serverState.recordBag) kill(childRecordBag.pid);
            if(serverState.runPPKLogger) kill(childPPKLogger.pid)

            if(serverState.recordPPKdata){
                childToPCD = exec(`bash ${pathToApp}/ppk_postOp.bash ${clientRequest.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runPPKLogger = false;
                    pushFeedMessage({"text": "Export to PCD, done!"});
                    pushFeedMessage({"text": "Export to PKL, done!"});
                });
            }else{
                exec(`bash ${pathToApp}/nopcd.bash ${clientRequest.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runPPKLogger = false;
                    pushFeedMessage({"text": "No data logged"});
                });
            }
            
            kill(childSensorsLauncher.pid, 'SIGINT', function() {
            // kill(childBagPlayer.pid, 'SIGINT', function() {

                pushFeedMessage({"text": "PPK process stopped"});    
                
                serverState.gpsPositionOK = false;
                serverState.lidarDataOK = false;
                serverState.recordBag = false;
                serverState.recordPPKdata = false;
            });                   
        }
    }
}

const shutdownCallback = (data, socket) => {
   
    processLog(`NEW2 shutdown signal got,value: ${data}`);

    // spawn("shutdown",['now']);
    if(data){

        exec(`sudo shutdown now`, (error, stdout, stderr) => {
            processLog("command called");
            
            if (error) {
                processLog(`exec error: ${error}`);
                return;
            }
            processLog(`stdout: ${stdout}`);
            processLog(`stderr: ${stderr}`);
        });
    }
}

const restartCallback = (data, socket) => {
        
    processLog(`restart signal got,value: ${data}`);
    if(data){
        
        exec(`sudo shutdown -r now`, (error, stdout, stderr) => {
            processLog("command called");
            
            if (error) {
                processLog(`exec errpr: ${error}`);
                return;
            }
            processLog(`stdout: ${stdout}`);
            processLog(`stderr: ${stderr}`);
        });
    }
}

const rmvableDEjectCallback = (data, socket) => {
        
    processLog("ejecting...");
    exec(`umount "${rmvableD_object.mountPoint}" `, async (error, stdout, stderr) => {
        processLog("command called: eject");
        
        if (error) {
            processLog(`exec error: ${error}`);
            return;
        }
        processLog(`stdout: ${stdout}`);
        processLog(`stderr: ${stderr}`);

        processLog("removable drive check...");
        driveNum = await driveRead();
        processLog(driveNum);
        // if(driveInit < driveNum){
        var i;
        for(i = 0; i < driveNum; i++){
            if(drives[i].isUSB){
                processLog("mountpoints after eject::");
                processLog(drives[i].mountpoints.length);
                if(drives[i].mountpoints.length){
                    rmvableD_status = true;
                    rmvableD_index = i;
                    processLog(`removable device detected on index ${rmvableD_index}`);
                }else{
                    processLog(`removable device unmounted`);

                    rmvableD_status = false;
                    socket.emit("rmvableDStatus", rmvableD_status);
                    socket.broadcast.emit("rmvableDStatus", rmvableD_status);
                }
            }
        }
        if(rmvableD_status === false) processLog("no removable disk");
    });
}

const rmvableDCheckCallback = async (data, socket) => {
    
    processLog("removable drive check...");
    driveNum = await driveRead();
    processLog(driveNum);
    // if(driveInit < driveNum){
    var i;
    for(i = 0; i < driveNum; i++){
        if(drives[i].isUSB){
            rmvableD_status = true;
            rmvableD_index = i;
            processLog(`removable device detected on index ${rmvableD_index}`);
        }
    }
    if(rmvableD_status === false){
        processLog("no removable disk");
        socket.emit("removableDiskNotDetected", true);
    } 
    

    // if(rmvableD_status) socket.emit("rmvableDProperties", drives[rmvableD_index]);
    if(rmvableD_status) {
        // processLog(drives[rmvableD_index].mountpoints[0]);
        rmvableD_object.name = drives[rmvableD_index].mountpoints[0].label;
        rmvableD_object.mountPoint = drives[rmvableD_index].mountpoints[0].path;
        processLog(`removable drive name ${rmvableD_object.name}`);
        processLog(`removable drive mountpoint ${rmvableD_object.mountPoint}`);

        try { 

            const diskRead = await diskusage.check(rmvableD_object.mountPoint);
            rmvableD_object.freeSpace = diskRead.free;
            rmvableD_object.totalSpace = diskRead.total; 
            processLog(`Free space: ${diskRead.free}`);

            socket.emit("rmvableDObject", rmvableD_object);
            socket.broadcast.emit("rmvableDObject", rmvableD_object);
            processLog(`emit ${rmvableD_object}`);

            socket.emit("rmvableDStatus", rmvableD_status);
            socket.broadcast.emit("rmvableDStatus", rmvableD_status);
        } catch (err) {
            processLog(err)
        }                
    }
}

const projectFolderCheck = (socket) => {
    
    fs.readdir(pathToProject, function(err, items) {
        processLog(items);
        processLog("read folders");
        socket.emit("serverFolderRead", items);
        socket.broadcast.emit("serverFolderRead", items);
    });
}

const clientFolderReadCallback = (data,socket) => {
    projectFolderCheck(socket)
}

const copyProjectCallback = (data, socket) => {
 
    if(rmvableD_status){
        
        pathToCopyDst = rmvableD_object.mountPoint + "/"
        processLog(pathToCopyDst);

        socket.emit("copyProcessStart", data);
        fs.copy(pathToProject+data, pathToCopyDst+data, (err) => {
            if (err){
                socket.emit("copyProcessError",err);
                pushFeedMessage({"text":`${err}`});
                return processLog("error occured" + err);
            }
            socket.emit("copyProcessFinish", data );                
            processLog("Copy Success! COOOOOY");
            pushFeedMessage({"text":`Folder ${data} successfuly copied to ${rmvableD_object.name}`});
        })
    }else{
        processLog("no removable disk")
        var noDriveError = "no removable drive."
        socket.emit("copyProcessError",noDriveError);
    }
    // processLog(pathToProject+data);
}

const deleteProjectCallback = (data, socket) => {
  
    fs.remove(pathToProject+data, function (err){
        if(err){
            return processLog("error occured" + err);
        }
        processLog("Project folder deleted!");
        pushFeedMessage({"text":`Project ${data} deleted`})
        projectFolderCheck(socket);
    })
}

var calibAccuracy = "";

const magnetoCalibLaunchCallback = (data, socket) => {
    if(data == true) {
        childMagnetoCalibLauncher = spawn('stdbuf',['-o', '0', 'roslaunch', 'sbg_driver', 'calibration_sbg_ellipse.launch']);

        //better to be moved on node listener
        serverState.magnetoCalib = "ready";
        processLog(`calib mag ${serverState.magnetoCalib}`);
        socket.emit("magnetoCalibState","ready");
        
        childMagnetoCalibLauncher.stdout.setEncoding('utf8');
        childMagnetoCalibLauncher.stdout.on('data', (data)=> {
            processLog('magnetocalib log:' + data );
            
            var calibOutput = data;
            // processLog('CALIBOUTPUT log:' +  calibOutput );
            if(calibOutput.includes("Accuracy")){
                processLog("accuracy foun");
                var stringPos = calibOutput.search('Accuracy');
                calibAccuracy = calibOutput.substring(stringPos,stringPos+29);
                socket.emit("magnetoCalibAccuracy", calibAccuracy);
            }
        });
    
        childMagnetoCalibLauncher.stderr.on('data', (data)=> {
            processLog(`magnetocalib error: ${data}`);
        });
    
        childMagnetoCalibLauncher.stdout.on('close', (code)=> {
            processLog(`magnetocalib closed with code: ${code}`);
        });

    }else{

        kill(childMagnetoCalibLauncher.pid, 'SIGINT');

        //better to be moved on node listener
        serverState.magnetoCalib = "not ready";
        processLog(`calib mag ${serverState.magnetoCalib}`);
        socket.emit("magnetoCalibState","not ready");            
    }
}

const magnetoCalibStartCallback = (data, socket) => {
    if(data == true) {

        childMagnetoCalibStart = exec('rosservice call mag_calibration',{
            silent: true,
            async: true
        }, function(){
            serverState.magnetoCalib = "calibrating";
            socket.emit("magnetoCalibState","calibrating");
            processLog("move start calib");                    
        });
    }else{
        childMagnetoCalibStart = exec('rosservice call mag_calibration',{
            silent: true,
            async: true
        }, function(){
            serverState.magnetoCalib = "ready";
            socket.emit("magnetoCalibState","ready");                
            processLog("move end calib");
        });
    }
}

const magnetoCalibSaveCallback = (data, socket) => {
    
    if(data == true) {
        childMagnetoCalibSave = exec('rosservice call mag_calibration_save',{
            silent: true,
            async: true
        }, function(){
            processLog(`calibration saved`);
            pushFeedMessage({"text":`${calibAccuracy}`});
            // calibration result on pushfeed
        });
    }
}

server.listen(port, () => routineLog(`Listening on port ${port}`));
