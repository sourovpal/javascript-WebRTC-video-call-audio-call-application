const express = require('express');
const app = express();
const socket = require('socket.io');

const server = app.listen(3000, ()=>{
    console.log("Server is Running.");
})

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

var io = socket(server);
io.on('connection', function(socket){
    console.log('User Connected: ', socket.id);
    socket.on('join', (roomName)=>{
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomName);
        if(room === undefined){
            socket.join(roomName);
            socket.emit('created');

            console.log('Room Created');
        }else if(room.size === 1){
            socket.join(roomName);
            socket.emit('joined');
            
            console.log('Room join');
        }else{
            socket.emit('full');
            console.log("Room full for now");
        }
    });

    socket.on('ready', (roomName)=>{
        console.log('Ready');
        socket.broadcast.to(roomName).emit('ready');
    });

    socket.on('candidate', (candidate, roomName)=>{
        socket.broadcast.to(roomName).emit('candidate', candidate);
    });

    socket.on('offer', (offer, roomName)=>{
        console.log('offer');
        socket.broadcast.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName)=>{
        console.log('answer');
        socket.broadcast.to(roomName).emit('answer', answer);
    });


});
