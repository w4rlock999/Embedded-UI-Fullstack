const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const ekf_nav = rosnodejs.require('sbg_driver').msg;
const sensor_msgs = rosnodejs.require('sensor_msgs').msg;

const app = express();
const port = process.env.PORT || 5000;
const index = require("./routes/index");

var psTree = require('ps-tree');

app.use(index);

const server = http.createServer(app);
const io = socketIo(server);

var myObject = 'helloW';

var serverState = {
    mappingRunning: false,
    runRoscore: false,
    gpsPositionOK: false,
    lidarDataOK: false,
    runTrajectoryLogger: false,
    runLidarMapper: false,
    withRecord: false,
    withRTmapping: false
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

var connectedClient = 0;

var kill = function (pid, signal, callback) {
    signal = signal || 'SIGKILL'
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
        
            if(data.status.gps1_pos_used && !serverState.gpsPositionOK){
                serverState.gpsPositionOK = true;    
                rosnodejs.log.info('Status gps position is True!');
            }else //below cannot be executed on roscore termination bcs no incoming data after. 
            if(!data.status.gps1_pos_used && serverState.gpsPositionOK){
                serverState.gpsPositionOK = false;    
                rosnodejs.log.info('Status gps position is False!');
            }
          }
        );

        let velodyne_points_sub = rosNode.subscribe('/velodyne_points', sensor_msgs.PointCloud2,
          (data) => {  
            if(!serverState.lidarDataOK){
                serverState.lidarDataOK = true;
                rosnodejs.log.info('lidar data OK!');
            }    
          }
        );
      });
}

// if (require.main === module) {
//     // Invoke Main Listener Function
//     // ekf_nav_listener();
    
// }

const timerCallback = async socket => {

    if(!serverState.mappingRunning){
        ros_topics_listener();
    }

    try {
        socket.emit("ServerState", serverState.mappingRunning);
        socket.broadcast.emit("ServerState", serverState.mappingRunning);
        
        socket.emit("gpsPositionOK",serverState.gpsPositionOK);
        socket.broadcast.emit("gpsPositionOK",serverState.gpsPositionOK);
        
        socket.emit("lidarDataOK", serverState.lidarDataOK);
        socket.broadcast.emit("lidarDataOK", serverState.lidarDataOK);

        console.log("timer callback 1000ms");
    } catch (error) {
        console.error(`Error: ${error.code}`);
    }

    if(serverState.lidarDataOK && serverState.gpsPositionOK){
        console.log("position OK, Lidar OK, Now start trajectory logging & mapping");
    }else{
        console.log("system not ready, missing some topic(s)")
    }

};

io.on("connection", socket => {
    console.log("New client connected");
    socket.emit("FromAPI", myObject);
    socket.emit("ServerState", serverState.mappingRunning);

    socket.on("frontInput", function (data) {
        console.log(data);
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
            // childBagPlayer = spawn('rosbag',['play', '/home/w4rlock999/Downloads/2019-04-12-21-02-09.bag']);
            childBagPlayer = exec('rosbag play /home/w4rlock999/Downloads/2019-04-12-21-02-09.bag',{
                        silent: true, 
                        async: true
            });
            serverState.mappingRunning = true;
         
        }else{

            myObject = 'mapping stopped';
            socket.emit("FromAPI", myObject);
            socket.broadcast.emit("FromAPI", myObject);
            console.log("client terminated process, mappingStart: " + data);
            
            // childBagPlayer.kill('SIGINT');

            kill(childBagPlayer.pid);

            serverState.mappingRunning = false;
            // serverState.runRoscore = false;
            serverState.gpsPositionOK = false;
            serverState.lidarDataOK = false;
            serverState.runTrajectoryLogger = false;
            serverState.runLidarMapper = false;
            serverState.withRecord = false;
            serverState.withRTmapping = false;

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