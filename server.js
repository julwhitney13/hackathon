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

var characterHistory = [];

// event-handler for new incoming connections
io.on('connection', function (socket) {

   characterHistory.push({x:((Math.random()*1990)+5),y:((Math.random()*1990)+5)});
   socket.emit('init_character', {id:characterHistory.length-1,position:characterHistory[characterHistory.length-1]});
   // first send the history to the new client
   socket.emit('update_characters', characterHistory);

   // add handler for message type "draw_line".
   socket.on('move_character', function (data) {
      // add received line to history
      characterHistory[data.id]=data.position
      // send line to all clients
      io.emit('update_characters', characterHistory);
   });
});
