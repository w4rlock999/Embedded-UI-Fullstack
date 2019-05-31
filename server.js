const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

// const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const index = require("./routes/index");

app.use(index);

const server = http.createServer(app);
const io = socketIo(server);


var myObject = 'helloW';

var serverState = {
    mappingRunning: false,
    runRoscore: false,
    runTrajectoryLogger: false,
    runLidarMapper: false,
    withRecord: false,
    withRTmapping: false,
};

let childRoscore;
var connectedClient = 0;


const emitMappingStatus = async socket => {

    try {
        socket.emit("ServerState", serverState.mappingRunning);
        socket.broadcast.emit("ServerState", serverState.mappingRunning);
        console.log("timer callback 1000ms");
    } catch (error) {
        console.error(`Error: ${error.code}`);
    }
    // res.send({ express: 'hello from backend!' });

};

io.on("connection", socket => {
    console.log("New client connected");
    socket.emit("FromAPI", myObject);
    socket.emit("ServerState", serverState.mappingRunning);

    socket.on("frontInput", function (data) {
        console.log(data);
    });

    socket.on("mappingStart", function (data) {
        if(data == true) {

            myObject = 'new data';
            socket.emit("FromAPI", myObject);
            socket.broadcast.emit("FromAPI", myObject);
            console.log("client send mappingStart: " + data);
            childRoscore = spawn("roscore");
            serverState.mappingRunning = true;
            serverState.runRoscore = true;
            
            // socket.emit("ServerState", serverState.mappingRunning);
            // socket.broadcast.emit("ServerState", serverState.mappingRunning);
            
            console.log(`pid: ${childRoscore.pid}`);         
        }else{

            myObject = 'mapping stopped';
            socket.emit("FromAPI", myObject);
            socket.broadcast.emit("FromAPI", myObject);
            console.log("client terminated process, mappingStart: " + data);
            childRoscore.kill();
            serverState.mappingRunning = false;
            serverState.runRoscore = false;
            
            // socket.emit("ServerState", serverState.mappingRunning);
            // socket.broadcast.emit("ServerState", serverState.mappingRunning);
            
        
        }
    });

    if(connectedClient == 0){
        setInterval( ()=>emitMappingStatus(socket),1000);
        connectedClient=connectedClient+1;
    } else {
        connectedClient=connectedClient+1;
    }
    // socket.one("mappingStopped", function (data) {

    // });

    socket.on("disconnect", () => console.log("client disconnected"));
});


server.listen(port, () => console.log(`Listening on port ${port}`));