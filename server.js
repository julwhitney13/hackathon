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

var characterInformation = {};
var specials = [];
var leaderboard = [];

function updateLeaderboard() {
    var full_ranking = [];
    for (id in characterInformation) {
        full_ranking.push(characterInformation[id]);
    }
    full_ranking.sort(compareScore);
    leaderboard = (full_ranking.length >= 10) ? full_ranking.slice(0, 10) : full_ranking;
    io.emit('update_leaderboard', leaderboard);
}

function compareScore(firstChar, secondChar) {
    return secondChar.score - firstChar.score;
}

function moveCharacter(data) {
  try {
    if (data.id in characterInformation) {
      characterInformation[data.id].x = data.pos.x;
      characterInformation[data.id].y = data.pos.y;
      characterInformation[data.id].angle = data.pos.angle;
      characterInformation[data.id].name = data.pos.name;
      io.emit('update_characters', characterInformation);
    }
  }
  catch(error) {
    console.log("[ERROR] Function move_character with error: " + error.message);
  }
}

// event-handler for new incoming connections
io.on('connection', function (socket) {

  // Initialization steps of character creation and sending leaderboard/character/specials information
  characterInformation[socket.id] = {x: Math.floor((Math.random()*2350)+25), y: Math.floor((Math.random()*1150)+25), score:0, angle:0, special:false, name:socket.id};
  socket.emit('init_character', {id: socket.id, pos: characterInformation[socket.id]});
  socket.emit('update_characters', characterInformation);
  socket.emit('update_specials', specials);

   // Handler for updating character movement
   socket.on('move_character', function (data) { moveCharacter(data) });

   // {id:ID, attack:{x: X, y: Y}, type:'A'}
   socket.on('attack', function(data) {
     var killedCharacters = [];
     var gotSpecials = [];
     var attackRadius = 40;


     if (data.type == 'B') {
       console.log(characterInformation[data.id].name + " used a special!");
       attackRadius = 80;
     }
     for (var key in characterInformation) {
       if (characterInformation.hasOwnProperty(key)) {
         var character = characterInformation[key];
         if ((Math.abs(character.x - data.attack.x) <= attackRadius) && (Math.abs(character.y - data.attack.y) <= attackRadius) && (data.id != key)) {
           killedCharacters.push(key);
         }
       }
     }

     for (var i=0;i<specials.length;i++) {
         var special = specials[i];
         if ((Math.abs(special.x - data.attack.x) <= attackRadius) && (Math.abs(special.y - data.attack.y) <= attackRadius)) {
           gotSpecials.push(i);
         }
     }
     for (var i=0; i < killedCharacters.length; i++) {
       socket.broadcast.to(killedCharacters[i]).emit( 'character_died', '');
     }
     if (gotSpecials.length > 0) {
       socket.emit('got_special','');
     }
     for (var j=0; j < gotSpecials.length; j++) {
       specials.splice(gotSpecials[j],1);
       io.emit('update_specials', specials);
     }
     if (characterInformation.hasOwnProperty(data.id)) {
       characterInformation[data.id].score += killedCharacters.length;
       console.log(characterInformation[data.id].name + " has attacked and killed " + killedCharacters.length.toString() + " turtles.");
     }
   });

   socket.on('init_name', function(name) {
     if (characterInformation.hasOwnProperty(socket.id)) {
       characterInformation[socket.id].name = name;
       updateLeaderboard();
     }
   });

   socket.on('disconnect', function() {
     delete characterInformation[socket.id];
     updateLeaderboard();
   });
});

/*----------------------------------------------------------------------------*/
/*------------------------------[Interval Calls]------------------------------*/
/*----------------------------------------------------------------------------*/

function createSpecial() {
  if (specials.length < 5) {
    specials.push({x:Math.floor((Math.random()*2350)+25) , y: Math.floor((Math.random()*1150)+25)});
    io.emit('update_specials', specials);
  }
  setTimeout(createSpecial, 10000);
}

createSpecial();

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/
