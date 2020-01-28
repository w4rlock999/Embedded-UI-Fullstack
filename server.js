const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const drivelist = require('drivelist');
const diskusage = require('diskusage');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var execSync = require('child_process').execSync;
const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const ekf_nav = rosnodejs.require('sbg_driver').msg;
const sensor_msgs = rosnodejs.require('sensor_msgs').msg;
const app = express();
const port = process.env.PORT || 5000;
const index = require("./routes/index");
var psTree = require('ps-tree');
// var fs = require('fs');
const fs = require('fs-extra'); 

app.use(index);
const server = http.createServer(app);
const io = socketIo(server);


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
let childBagPlayer; //sementara, ganti dengan mapping launch file
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

var date = new Date();
var current_hours = date.getHours();
var current_minute = date.getMinutes();

var feedMessages = [{"text":"Tap on floating icon to start mapping.", 
                     "time":( (current_hours<10)?`0${current_hours}`:`${current_hours}`) + (`:`) 
                            + ((current_minute<10)?`0${current_minute}`:`${current_minute}`)}];

var backendMsgFileDir = '../backendMsg.json';
fs.writeFile(backendMsgFileDir, JSON.stringify(feedMessages, null, 2), function (err){
    if(err) return console.log(err);
    console.log("writing initial message file");
});

var driveNum;
var driveInit;
var rmvableD_status;
var rmvableD_object = {
    name: "",
    mountPoint: "",
    freeSpace: 0.0,
    totalSpace: 0.0,
};
var rmvableD_index;
var drives;

const driveStart = async function(){
    drives = await drivelist.list();
    driveInit = drives.length;
    console.log("initializing read drives....");
    console.log(drives.length);
}

const driveRead = async function(){
    drives = await drivelist.list();
    console.log("read drives....");
    console.log(drives);
    console.log(drives.length);
    return drives.length;
}

driveStart();

var connectedClient = 0;

function pushFeedMessage (newMessage) {
    
    var newDate = new Date();
    
    current_hours = newDate.getHours();
    current_minute = newDate.getMinutes();
    
    newMessage["time"] = ( (current_hours<10)?`0${current_hours}`:`${current_hours}`) + (`:`) 
                            + ((current_minute<10)?`0${current_minute}`:`${current_minute}`);
    
    feedMessages.unshift(newMessage);
    fs.writeFile(backendMsgFileDir, JSON.stringify(feedMessages, null, 2), function (err){
        if(err) return console.log(err);
        console.log("writing to log file");
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

if (require.main === module) {
    // Invoke Main Listener Function
    ros_topics_listener();   
}

var prevLidarDataOK = false;
var prevGpsPositionOK = false;


const timerCallback = async socket => {

    try {
        socket.emit("serverMessage", feedMessages);
        socket.broadcast.emit("serverMessage", feedMessages);

        socket.emit("processRunning", serverState.processRunning);
        socket.broadcast.emit("processRunning", serverState.processRunning);

        console.log("timer callback 1000ms");
    } catch (error) {
        console.error(`Error: ${error.code}`);
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

        console.log("position OK, Lidar OK, Now start main process");
        
        if(clientRequest.RTKprocess && !clientRequest.PPKprocess){                          //RTK main process
      
            if(!serverState.runTrajectoryLogger){

                childTrajectoryLogger = exec(`rosrun trajectory_logger trajectory_logger 0`,{
                    silent: true, 
                    async: true
                });
                console.log("start logging");
                pushFeedMessage({"text":"Trajectory Logger running..."});
                serverState.runTrajectoryLogger = true;
            }
            if(!serverState.runLidarMapper){
    
                childLidarMapping = exec('rosrun trajectory_logger lidar_mapper',{
                    silent: true, 
                    async: true
                }); 
                console.log("start mapper");
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

                childPPKLogger = exec('rosrun trajectory_logger ppk_logger',{
                    silent: true,
                    async: true
                });
                console.log("start ppk logger");
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
            console.log("client request not valid");
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
        console.log("system not ready, missing some topic(s)");
    }

    prevLidarDataOK = serverState.lidarDataOK;
    prevGpsPositionOK = serverState.gpsPositionOK;
};

io.on("connection", socket => {
    
    console.log("New client connected");

    //======================= Main Process Handler =====================================
    //==================================================================================

    socket.on("clientRequest", function (data) {
        clientRequest = data;
        console.log(`params received`);

        console.log(`project name ${clientRequest.projectName}`);
        console.log(`save to ${clientRequest.saveTo}`);
        console.log(`record bag ${clientRequest.recordBag}`);
        console.log(`RTK mapping ${clientRequest.RTKprocess}`);
        console.log(`PPK mapping ${clientRequest.PPKprocess}`);
    });

    socket.on("processStart", function (data) {
        if(data == true) {

            console.log("client send processStart: " + data);

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

            console.log("client terminated process, processStart: " + data);
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
    });
    //==================================================================================

    //=============== POWER Operation HANDLER ==========================================
    //==================================================================================

    socket.on("shutdown", function (data) {
        console.log(`NEW2 shutdown signal got,value: ${data}`);

        // spawn("shutdown",['now']);
        if(data){

            exec(`sudo shutdown now`, (error, stdout, stderr) => {
                console.log("command called");
                
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });
        }
    });

    socket.on("restart", function (data) {
        
        console.log(`restart signal got,value: ${data}`);
        if(data){
            
            exec(`sudo shutdown -r now`, (error, stdout, stderr) => {
                console.log("command called");
                
                if (error) {
                    console.error(`exec errpr: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
            });
        }
    });
    //==================================================================================

    //========================= Removable Disk Handler =================================
    //==================================================================================

    socket.on("rmvableDEject", function (data) {
        
        console.log("ejecting...");
        exec(`umount "${rmvableD_object.mountPoint}" `, async (error, stdout, stderr) => {
            console.log("command called: eject");
            
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            console.log("removable drive check...");
            driveNum = await driveRead();
            console.log(driveNum);
            // if(driveInit < driveNum){
            var i;
            for(i = 0; i < driveNum; i++){
                if(drives[i].isUSB){
                    console.log("mountpoints after eject::");
                    console.log(drives[i].mountpoints.length);
                    if(drives[i].mountpoints.length){
                        rmvableD_status = true;
                        rmvableD_index = i;
                        console.log(`removable device detected on index ${rmvableD_index}`);
                    }else{
                        console.log(`removable device unmounted`);

                        rmvableD_status = false;
                        socket.emit("rmvableDStatus", rmvableD_status);
                        socket.broadcast.emit("rmvableDStatus", rmvableD_status);
                    }
                }
            }
            if(rmvableD_status === false) console.log("no removable disk");
        });
    });
    
    socket.on("rmvableDCheck", async function (data) {
        console.log("removable drive check...");
        driveNum = await driveRead();
        console.log(driveNum);
        // if(driveInit < driveNum){
        var i;
        for(i = 0; i < driveNum; i++){
            if(drives[i].isUSB){
                rmvableD_status = true;
                rmvableD_index = i;
                console.log(`removable device detected on index ${rmvableD_index}`);
            }
        }
        if(rmvableD_status === false) console.log("no removable disk");
        //emit some feedback to client here

        // if(rmvableD_status) socket.emit("rmvableDProperties", drives[rmvableD_index]);
        if(rmvableD_status) {
            // console.log(drives[rmvableD_index].mountpoints[0]);
            rmvableD_object.name = drives[rmvableD_index].mountpoints[0].label;
            rmvableD_object.mountPoint = drives[rmvableD_index].mountpoints[0].path;
            console.log(`removable drive name ${rmvableD_object.name}`);
            console.log(`removable drive mountpoint ${rmvableD_object.mountPoint}`);

            try { 

                const diskRead = await diskusage.check(rmvableD_object.mountPoint);
                rmvableD_object.freeSpace = diskRead.free;
                rmvableD_object.totalSpace = diskRead.total; 
                console.log(`Free space: ${diskRead.free}`);

                socket.emit("rmvableDObject", rmvableD_object);
                socket.broadcast.emit("rmvableDObject", rmvableD_object);
                console.log(`emit ${rmvableD_object}`);

                socket.emit("rmvableDStatus", rmvableD_status);
                socket.broadcast.emit("rmvableDStatus", rmvableD_status);
            } catch (err) {
                console.error(err)
            }                
        }
    });
    //==================================================================================
    
    //======================= Project Folder Handler ===================================
    //==================================================================================

    fs.readdir(pathToProject, function(err, items) {
        console.log(items);
        console.log("read folders");
        socket.emit("serverFolderRead", items);
        socket.broadcast.emit("serverFolderRead", items);
    });

    socket.on("clientFolderRead", function (data) {
        fs.readdir(pathToProject, function(err, items) {
            console.log(items);
            console.log("read folders");
            socket.emit("serverFolderRead", items);
            socket.broadcast.emit("serverFolderRead", items);
        });
    });

    socket.on("copyProject", function(data) {
        if(rmvableD_status){
            
            pathToCopyDst = rmvableD_object.mountPoint + "/"
            console.log(pathToCopyDst);

            //emit client feedback and make some graphical change (waiting copy process)
            fs.copy(pathToProject+data,pathToCopyDst+data, function (err){
                if (err){
                    return console.error("error occured" + err);
                }                
                console.log("Copy Success!");
                pushFeedMessage({"text":`Folder ${data} to ${rmvableD_object.name} copied!`});
                //emit client feedback and make some graphical change 
            })
        }else{
            console.log("no removable disk")
            //write client feedback
        }
        // console.log(pathToProject+data);
    });

    socket.on("deleteProject", function(data) {
        fs.remove(pathToProject+data, function (err){
            if(err){
                return console.error("error occured" + err);
            }
            console.log("Project folder deleted!");
            pushFeedMessage({"text":`Project ${data} deleted`})
            
            fs.readdir(pathToProject, function(err, items) {
                console.log(items);
                console.log("read folders");
                socket.emit("serverFolderRead", items);
                socket.broadcast.emit("serverFolderRead", items);
            });
        })
    });
    //==================================================================================

    //======================= Magneto Calib Handler ====================================
    //==================================================================================

    socket.on("magnetoCalibLaunch", function (data) {
        if(data == true) {
            childMagnetoCalibLauncher = spawn('stdbuf',['-o', '0', 'roslaunch', 'sbg_driver', 'calibration_sbg_ellipse.launch']);

            //better to be moved on node listener
            serverState.magnetoCalib = "ready";
            console.log(`calib mag ${serverState.magnetoCalib}`);
            socket.emit("magnetoCalibState","ready");
            
            childMagnetoCalibLauncher.stdout.setEncoding('utf8');
            childMagnetoCalibLauncher.stdout.on('data', (data)=> {
                console.log('magnetocalib log:' + data );
                
                var calibOutput = data;
                // console.log('CALIBOUTPUT log:' +  calibOutput );
                if(calibOutput.includes("Accuracy")){
                    console.log("accuracy foun");
                    var stringPos = calibOutput.search('Accuracy');
                    var calibAccuracy = calibOutput.substring(stringPos,stringPos+29);
                    socket.emit("magnetoCalibAccuracy", calibAccuracy);
                }
            });
        
            childMagnetoCalibLauncher.stderr.on('data', (data)=> {
                console.log(`magnetocalib error: ${data}`);
            });
        
            childMagnetoCalibLauncher.stdout.on('close', (code)=> {
                console.log(`magnetocalib closed with code: ${code}`);
            });

        }else{

            kill(childMagnetoCalibLauncher.pid, 'SIGINT');

            //better to be moved on node listener
            serverState.magnetoCalib = "not ready";
            console.log(`calib mag ${serverState.magnetoCalib}`);
            socket.emit("magnetoCalibState","not ready");            
        }
    });

    socket.on("magnetoCalibStart", function (data){
        if(data == true) {

            childMagnetoCalibStart = exec('rosservice call mag_calibration',{
                silent: true,
                async: true
            }, function(){
                serverState.magnetoCalib = "calibrating";
                socket.emit("magnetoCalibState","calibrating");
                console.log("move start calib");                    
            });
        }else{
            childMagnetoCalibStart = exec('rosservice call mag_calibration',{
                silent: true,
                async: true
            }, function(){
                serverState.magnetoCalib = "ready";
                socket.emit("magnetoCalibState","ready");                
                console.log("move end calib");
            });
        }
    });

    socket.on("magnetoCalibSave", function (data){
        if(data == true) {
            childMagnetoCalibSave = exec('rosservice call mag_calibration_save',{
                silent: true,
                async: true
            }, function(){
                console.log(`calibration saved`);
            });
        }
    });
    //==================================================================================
    //==================================================================================

    if(connectedClient == 0){
        setInterval( ()=>timerCallback(socket),1000);
        connectedClient=connectedClient+1;
    } else {
        connectedClient=connectedClient+1;
    }

    socket.on("disconnect", () => console.log("client disconnected"));
});


server.listen(port, () => console.log(`Listening on port ${port}`));
