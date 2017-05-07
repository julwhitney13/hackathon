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
var specials = {};

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

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
        io.emit('update_specials', specials);
        if (specials.length >= 1) {
          console.log("specialX: " + specials[0].x.toString() + " specialY: " + specials[0].y.toString());
        }
      }
   });

   // {id:ID, attack:{x: X, y: Y}, type:'A'}
   socket.on('attack', function(data) {
     var dead = [];
     var gotSpecials = [];
     var attackRadius = 40;
     console.log("Attack has happened.");
     if (data.type == 'B') {
       attackRadius = 80;
       console.log("SUPER ATTACK");
     }
     for (var key in characterHistory) {
       if (characterHistory.hasOwnProperty(key)) {
         var character = characterHistory[key];
         if ((Math.abs(character.x - data.attack.x) <= attackRadius) && (Math.abs(character.y - data.attack.y) <= attackRadius) && (data.id != key)) {
           dead.push(key);
         }
       }
     }

     for (var skey in specials) {
       if (specials.hasOwnProperty(skey)) {
         var special = specials[skey];
         if ((Math.abs(special.x - data.attack.x) <= attackRadius) && (Math.abs(special.y - data.attack.y) <= attackRadius)) {
           gotSpecials.push(skey);
         }
       }
     }
     for (var i=0; i < dead.length; i++) {
       socket.broadcast.to(dead[i]).emit( 'character_died', '');
     }
     if (gotSpecials.length > 0) {
       console.log("gotSpecial!! " + data.id);
       socket.emit('got_special','');
     }
     for (var j=0; j < gotSpecials.length; j++) {
       delete specials[gotSpecials[j]];
     }
     characterHistory[data.id].score += dead.length;
   });

   characterHistory[socket.id] = {x: Math.floor((Math.random()*2350)+25), y: Math.floor((Math.random()*1150)+25), score:0, angle:0, special:false};
   socket.emit('init_character', {id: socket.id, pos: characterHistory[socket.id]});

   socket.on('disconnect', function() {
     delete characterHistory[socket.id];
   });

});

function createSpecial() {
  var sid = makeid();
  if (Object.keys(specials).length < 5) {
    specials[sid] = {x:Math.floor((Math.random()*2350)+25) , y: Math.floor((Math.random()*1150)+25)};
    console.log("Special being created " + specials[sid].x.toString());
  }

  setTimeout(createSpecial, 10000);
}

createSpecial();
