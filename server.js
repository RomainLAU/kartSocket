const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

let players = {};
const starPositions = [
  { x: 100, y: 120 },
  { x: 700, y: 120 },
  { x: 100, y: 400 },
  { x: 700, y: 400 },
  { x: 400, y: 280 },
  { x: 250, y: 280 },
  { x: 550, y: 460 },
];
var scores = {
  blue: 0,
  red: 0,
}; 

let starLocation = 0;

const getStarLocation = () => {  
  const lastStarLocation = starLocation;

  while (lastStarLocation === starLocation) {
    starLocation = Math.floor(Math.random() * starPositions.length);
  }

  return starPositions[starLocation];
}

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 101) + 175,
    y: Math.floor(Math.random() * 75) + 425,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) == 0 ? 'red' : 'blue',
  };
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', starPositions[starLocation]);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('teamLap', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 1;

      if (scores.red === 8) {
        socket.emit('teamWin', 'red');

        scores.red = 0;
        scores.blue = 0;
      }
    } else {
      scores.blue += 1;

      if (scores.blue === 8) {
        socket.emit('teamWin', 'blue');

        scores.red = 0;
        scores.blue = 0;
      }
    }

    io.emit('starLocation', getStarLocation());
    io.emit('scoreUpdate', scores);
  });

  socket.on('teamChanged', function () {
    players[socket.id].team = players[socket.id].team === 'red' ? 'blue' : 'red';
    io.emit('teamChanged', players[socket.id]);
  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
