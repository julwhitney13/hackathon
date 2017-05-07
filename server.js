var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// start webserver on port 8080
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);
// add directory with our static files
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

// array of all lines drawn
// 2000 x 2000
// characters are 5 x 5

var characterHistory = {};

// event-handler for new incoming connections
io.on('connection', function (socket) {

   // first send the history to the new client
   socket.emit('update_characters', characterHistory);

   // add handler for message type "draw_line".
   socket.on('move_character', function (data) {
      // add received line to history
      if (data.id in characterHistory) {
        characterHistory[data.id].x = data.pos.x;
        characterHistory[data.id].y = data.pos.y;
        characterHistory[data.id].angle = data.pos.angle;
        // send line to all clients
        io.emit('update_characters', characterHistory);
        console.log("Angle:" + data.pos.angle.toString());
      }
   });

   // {id:ID, attack:{x: X, y: Y}, type:'A'}
   socket.on('attack', function(data) {
     var dead = [];
     console.log("Attack has happened.");
     for (var key in characterHistory) {
       if (characterHistory.hasOwnProperty(key)) {
         var character = characterHistory[key];
         if ((Math.abs(character.x - data.attack.x) <= 40) && (Math.abs(character.y - data.attack.y) <= 40) && (data.id != key)) {
           dead.push(key);
         }
       }
     }
     for (var i=0; i < dead.length; i++) {
       socket.broadcast.to(dead[i]).emit( 'character_died', '');
       characterHistory[data.id].score += 1
     }
   });

   characterHistory[socket.id] = {x: Math.floor((Math.random()*490)+5), y: Math.floor((Math.random()*490)+5), score:0, angle:0};
   socket.emit('init_character', {id: socket.id, pos: characterHistory[socket.id]});

   socket.on('disconnect', function() {
     delete characterHistory[socket.id];
   });
});
