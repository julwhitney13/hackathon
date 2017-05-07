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
      characterHistory[data.id]={x: data.pos.x, y: data.pos.y};
      // send line to all clients
      io.emit('update_characters', characterHistory);
   });

   // {id:ID, attack:{x: X, y: Y}, type:'A'}
   socket.on('attack', function(data) {
     var dead = [];
     for (var key in characterHistory) {
       if (characterHistory.hasOwnProperty(key)) {
         var character = characterHistory[key];
         if ((Math.abs(character.x - data.attack.x) <= 10) && (Math.abs(character.y - data.attack.y) <= 10) && (data.id != key)) {
           dead.push({id:key});
         }
       }
     }
     for (var i=0; i < dead.length; i++) {
       delete characterHistory[dead[i]];
       io.sockets.socket(dead[i]).emit("character_died");
     }
   });

   characterHistory[socket.id] = {x: Math.floor((Math.random()*1990)+5), y: Math.floor((Math.random()*1990)+5)};
   socket.emit('init_character', {id: socket.id, pos: characterHistory[socket.id]});

   socket.on('disconnect', function() {
     delete characterHistory[socket.id];
   });
});
