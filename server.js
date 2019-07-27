const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const drivelist = require('drivelist');
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
var fs = require('fs');

app.use(index);
const server = http.createServer(app);
const io = socketIo(server);


var pathToProject = "/home/w4rlock999/oneMap-Project/";
var pathToApp = "/home/w4rlock999/Workspace/web/onemap-fullstack";
// var pathToProject = "/home/rekadaya/oneMap-Project/";
// var pathToApp = "/home/rekadaya/ui_dir/onemap-fullstack";

var serverState = {
    mappingRunning: false,
    gpsPositionOK: false,
    lidarDataOK: false,
    runTrajectoryLogger: false,
    runLidarMapper: false,
    recordBag: false,
    realtimeMapping: false
};
var clientState = {
    projectName: "",
    saveTo: "",
    azimuth: "",
    recordBag: true,
    realtimeMapping: true
};

let childRoscore;
let childBagPlayer; //sementara, ganti dengan mapping launch file
let childMapperLauncher;
let childTrajectoryLogger;
let childLidarMapping;
let childSaveMapped;
let childRecordBag;
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

const driveStart = async function(){
    const drives = await drivelist.list();
    console.log("read drives....")
    console.log(drives[0].mountpoints);
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
    // Register node with ROS master
    rosnodejs.initNode('/server_listener_node')
      .then((rosNode) => {
        
        let ekf_nav_sub = rosNode.subscribe('/ekf_nav', ekf_nav.SbgEkfNav,
          (data) => { 
        
            if(data.status.gps1_pos_used && !serverState.gpsPositionOK && serverState.mappingRunning){
                serverState.gpsPositionOK = true;    
                rosnodejs.log.info('Status gps position is True!');
            }else //below cannot be executed on roscore termination bcs no incoming data after. 
            if(!data.status.gps1_pos_used && serverState.gpsPositionOK && serverState.mappingRunning){
                serverState.gpsPositionOK = false;    
                rosnodejs.log.info('Status gps position is False!');
            }
          }
        );

        let velodyne_points_sub = rosNode.subscribe('/velodyne_points', sensor_msgs.PointCloud2,
          (data) => {  
            if(!serverState.lidarDataOK && serverState.mappingRunning){
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

        socket.emit("mappingRunning", serverState.mappingRunning);
        socket.broadcast.emit("mappingRunning", serverState.mappingRunning);
        
        socket.emit("gpsPositionOK",serverState.gpsPositionOK);
        socket.broadcast.emit("gpsPositionOK",serverState.gpsPositionOK);
        
        socket.emit("lidarDataOK", serverState.lidarDataOK);
        socket.broadcast.emit("lidarDataOK", serverState.lidarDataOK);

        console.log("timer callback 1000ms");
    } catch (error) {
        console.error(`Error: ${error.code}`);
    }

    if(!prevLidarDataOK && serverState.lidarDataOK){
        pushFeedMessage({"text":"Lidar data OK!"});
    }

    if(!prevGpsPositionOK && serverState.gpsPositionOK){
        pushFeedMessage({"text":"GPS Position OK!"});
    }

    if(serverState.lidarDataOK && serverState.gpsPositionOK){

        console.log("position OK, Lidar OK, Now start trajectory logging & mapping");
        
        if(!serverState.runTrajectoryLogger){

            childTrajectoryLogger = exec(`rosrun trajectory_logger trajectory_logger ${clientState.azimuth}`,{
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

        if(clientState.recordBag && !serverState.recordBag){

            childRecordBag = exec(`bash ${pathToApp}/record.bash ${clientState.projectName}`,{
                        silent: true, 
                        async: true
            });
            pushFeedMessage({"text":"Recording bag file"});
            serverState.recordBag = true;
        }

        if(clientState.realtimeMapping && !serverState.realtimeMapping){

            childSaveMapped = exec(`bash ${pathToApp}/rtmapping.bash ${clientState.projectName}`,{
                        silent: true, 
                        async: true
            });
            pushFeedMessage({"text":"Recording mapped data"});
            serverState.realtimeMapping = true;
        }

    }else{
        console.log("system not ready, missing some topic(s)");
    }

    prevLidarDataOK = serverState.lidarDataOK;
    prevGpsPositionOK = serverState.gpsPositionOK;
};

io.on("connection", socket => {
    
    console.log("New client connected");
    socket.emit("ServerState", serverState.mappingRunning);
    socket.on("frontInput", function (data) {
        console.log(data);
    });

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

    fs.readdir(pathToProject, function(err, items) {
        console.log(items);
        console.log("read folders");
        socket.emit("serverFolderRead", items);
    });

    socket.on("clientFolderRead", function (data) {
        fs.readdir(pathToProject, function(err, items) {
            console.log(items);
            console.log("read folders");
            socket.emit("serverFolderRead", items);
        });
    });

    socket.on("clientRequestParams", function (data) {
        clientState = data;
        console.log(`params received`);
        console.log(`project name ${clientState.projectName}`);
        console.log(`save to ${clientState.saveTo}`);
        console.log(`record bag ${clientState.recordBag}`);
        console.log(`RT mapping ${clientState.realtimeMapping}`);
        console.log(`azimuth ${clientState.azimuth}`);
    });

    socket.on("mappingStart", function (data) {
        if(data == true) {

            console.log("client send mappingStart: " + data);

            // childBagPlayer = exec('rosbag play /home/rekadaya//Downloads/2019-04-12-21-02-09.bag --clock',{
            //     silent: true, 
            //     async: true
            // });

            childMapperLauncher = exec('roslaunch trajectory_logger devices.launch',{
                silent: true,
                async: true
            });
   
            pushFeedMessage({"text": "MAPPING PROCESS STARTED for "+ clientState.projectName +""});
            serverState.mappingRunning = true;
         
        }else{

            console.log("client terminated process, mappingStart: " + data);
            serverState.mappingRunning = false;

            if(serverState.realtimeMapping && serverState.recordBag && serverState.runLidarMapper && serverState.runTrajectoryLogger ){

                kill(childLidarMapping.pid, 'SIGINT');
                kill(childTrajectoryLogger.pid);
                kill(childRecordBag.pid);
                kill(childSaveMapped.pid);                 //if using exec (should prefer this, killing all the process)    
            }
            kill(childMapperLauncher.pid, 'SIGINT', function() {
            // kill(childBagPlayer.pid, 'SIGINT', function() {

                pushFeedMessage({"text": "Mapping process stopped"});    
                
                serverState.gpsPositionOK = false;
                serverState.lidarDataOK = false;
                serverState.recordBag = false;
                serverState.realtimeMapping = false;
            }); 
            
            if(serverState.realtimeMapping){
                childToPCD = exec(`bash ${pathToApp}/topcd.bash ${clientState.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runTrajectoryLogger = false;
                    serverState.runLidarMapper = false;
                    pushFeedMessage({"text": "Export to PCD, done!"});
                });
            }else{
                exec(`bash ${pathToApp}/nopcd.bash ${clientState.projectName}`,{
                    killSignal: 'SIGINT'
                }, 
                function(){
    
                    serverState.runTrajectoryLogger = false;
                    serverState.runLidarMapper = false;
                    pushFeedMessage({"text": "No data mapped"});
                });
            }
            
        }
    });

    if(connectedClient == 0){
        setInterval( ()=>timerCallback(socket),1000);
        connectedClient=connectedClient+1;
    } else {
        connectedClient=connectedClient+1;
    }

    socket.on("disconnect", () => console.log("client disconnected"));
});


server.listen(port, () => console.log(`Listening on port ${port}`));
