/*----------------------------------------------------------------------------*/
/*-----------------------[Required / Global Variables]------------------------*/
/*----------------------------------------------------------------------------*/

var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

// WebServer setup
var server =  http.createServer(app);
var io = socketIo.listen(server);

// Game information storage
var characterInformation = {};
var specials = [];
var leaderboard = [];

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*--------------------------------[WebServer]---------------------------------*/
/*----------------------------------------------------------------------------*/

// Starts WebServer on port 8080
server.listen(8080);
// Add directory with our static files
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:8080");

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*-------------------------------[Leaderboard]--------------------------------*/
/*----------------------------------------------------------------------------*/

function updateLeaderboard() {
    var sortedLeaderboard = [];
    for (id in characterInformation) {
        sortedLeaderboard.push(characterInformation[id]);
    }
    sortedLeaderboard.sort(compareScore);
    leaderboard = (sortedLeaderboard.length >= 10) ? sortedLeaderboard.slice(0, 10) : sortedLeaderboard;
    io.emit('update_leaderboard', leaderboard);
}

function compareScore(firstChar, secondChar) {
    return secondChar.score - firstChar.score;
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*-----------------------------[Helper Functions]-----------------------------*/
/*----------------------------------------------------------------------------*/

// Update characterInformation with income data of movement and broadcasts to all players
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
    console.log("[ERROR] Function moveCharacter with error: " + error.message);
  }
}

// Checks if object gets hit by the attack (Called by checkHitSpecial and checkHitCharacter)
// Format of attackData: {id:ID, attack:{x: X, y: Y}, type:'A'}
function checkHit(attackData, object) {
  try {
    var attackRadius = 40;
    var hit = false;
    if (attackData.type == 'B') {
      console.log(characterInformation[attackData.id].name + " used a special!");
      attackRadius = 80;
    }

    if ((Math.abs(object.x - attackData.attack.x) <= attackRadius) && (Math.abs(object.y - attackData.attack.y) <= attackRadius)) {
      hit = true;
    }
    return hit;
  }
  catch (error) {
    console.log("[ERROR] Function checkHit with error: " + error.message);
  }

}

// Checks if any specials are hit by the attack
function checkHitSpecial(attackData, socket) {
  try {
    var gotSpecials = [];

    for (var i=0;i<specials.length;i++) {
        var special = specials[i];
        if (checkHit(attackData,special)) {
          gotSpecials.push(i);
        }
    }

    if (gotSpecials.length > 0) {
      socket.emit('got_special','');
    }
    for (var j=0; j < gotSpecials.length; j++) {
      specials.splice(gotSpecials[j],1);
      io.emit('update_specials', specials);
    }
  }
  catch(error) {
    console.log("[ERROR] Function checkHitSpecial with error: " + error.message);
  }
}

// Checks if any characters are hit by the attack
function checkHitCharacter(attackData, socket) {
  try {
    var killedCharacters = [];

    for (var key in characterInformation) {
      if (characterInformation.hasOwnProperty(key)) {
        var character = characterInformation[key];
        if (checkHit(attackData,character) && (attackData.id != key)) {
          killedCharacters.push(key);
          socket.broadcast.to(key).emit( 'character_died', '')
        }
      }
    }

    if (characterInformation.hasOwnProperty(attackData.id)) {
      characterInformation[attackData.id].score += killedCharacters.length;
      console.log(characterInformation[attackData.id].name + " has attacked and killed " + killedCharacters.length.toString() + " turtles.");
    }
  }
  catch(error) {
    console.log("[ERROR] Function checkHitCharacter with error: " + error.message);
  }
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*--------------------------------[Main Loop]---------------------------------*/
/*----------------------------------------------------------------------------*/

// Handler for any new incoming connections
io.on('connection', function (socket) {

  // Initialization steps of character creation and sending leaderboard/character/specials information
  try {
    characterInformation[socket.id] = {x: Math.floor((Math.random()*2350)+25), y: Math.floor((Math.random()*1150)+25), score:0, angle:0, special:false, name:socket.id};
    socket.emit('init_character', {id: socket.id, pos: characterInformation[socket.id]});
    socket.emit('update_characters', characterInformation);
    socket.emit('update_specials', specials);
  }
  catch (error) {
    console.log("[ERROR] Socket function 'connection' with error: " + error.message);
  }

   // Handler for updating character movement
   socket.on('move_character', function (data) {
     moveCharacter(data)
   });

   // Handler for attack processing
   socket.on('attack', function(attackData) {
     checkHitCharacter(attackData, socket);
     checkHitSpecial(attackData, socket);
   });

   // Handler for initial name tagging
   socket.on('init_name', function(name) {
     if (characterInformation.hasOwnProperty(socket.id)) {
       characterInformation[socket.id].name = name;
       updateLeaderboard();
     }
   });

   // Handler for socket disconnect
   socket.on('disconnect', function() {
     delete characterInformation[socket.id];
     updateLeaderboard();
   });
});

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*------------------------------[Interval Calls]------------------------------*/
/*----------------------------------------------------------------------------*/

// Creates a special every 10 seconds if less than 5 exists on the map
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
