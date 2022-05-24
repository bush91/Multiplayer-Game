const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io =  require("socket.io")(http);
const port = process.env.PORT || 3000;

var players = {}
var online_players = [];
var player_num = 1;

http.listen(port, () => {
    console.log('socket.io server running at http://localhost:$(port)/');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use('/static', express.static(__dirname + '/static'))

io.on('connection', function (socket) {
    console.log('player [' + socket.id + '] connected')

    players[socket.id] = {
        rotation: 0,
        x: 30,
        y: 30,
        playerId: socket.id,
        name: 'player ' + player_num,
        color: getRandomColor()
    }
    online_players.push(players[socket.id].name);
    socket.emit('currentPlayers', players)
    socket.broadcast.emit('newPlayer', players[socket.id])
    //socket.emit('onlinePlayers',online_players)

    socket.on('disconnect', function () {
        console.log('player [' + socket.id + '] disconnected')
        delete players[socket.id]
        io.emit('playerDisconnected', socket.id)
    })

    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x
        players[socket.id].y = movementData.y
        players[socket.id].rotation = movementData.rotation

        socket.broadcast.emit('playerMoved', players[socket.id])
    })
})

function getRandomColor() {
    return '0x' + Math.floor(Math.random() * 16777215).toString(16)
}