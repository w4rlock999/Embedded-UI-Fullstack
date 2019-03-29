const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
var exec = require('child_process').exec;

// const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;
const index = require("./routes/index");

app.use(index);

const server = http.createServer(app);
const io = socketIo(server);


var myObject = 'helloW';

var serverState = {
    runRoscore: false,
    runTrajectoryLogger: false,
    runLidarMapper: false,
    withRecord: false,
    withRTmapping: false,
};

let childRoscore;

io.on("connection", socket => {
    console.log("New client connected");
    socket.emit("FromAPI", myObject);

    socket.on("frontInput", function (data) {
        console.log(data);
    });

    socket.on("mappingStart", function (data) {
        if(data == true) {

            myObject = 'new data';
            socket.emit("FromAPI", myObject);
            socket.broadcast.emit("FromAPI", myObject);
            console.log("client send mappingStart: " + data);
            childRoscore = exec("roscore");         
        }
    });

    socket.on("disconnect", () => console.log("client disconnected"));
});

const getApiAndEmit = async socket => {

    // res.send({ express: 'hello from backend!' });
    // socket.emit("FromAPI", myObject);
};

server.listen(port, () => console.log(`Listening on port ${port}`));