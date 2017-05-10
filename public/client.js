var img = new Image();
var others = new Image();
var normal_img= new Image();
var attack_img_a = new Image();
var attack_img_b = new Image();
var special_img = new Image();
var special_attack_img_a = new Image();
var special_attack_img_b = new Image();

var view_radius = 130;
var view_angle = Math.PI * 0.33;
var cached_leaderboard = [];

const width = 1200;
const height = 600;
const imageWidth = 50;
const imageHeight = 80;
const deg90 = 1.5708;
const border = 200;
const mapWidth = 2400;
const mapHeight = 1200;
var username = "";
normal_img.src = "image/1.png";
attack_img_a.src = "image/2.png";
attack_img_b.src = "image/3.png";
special_img.src = "image/s1.png";
special_attack_img_a.src = "image/s2.png";
special_attack_img_b.src = "image/s3.png";
img = normal_img;
others = normal_img;

/*----------------------------------------------------------------------------*/
/*------------------------------[Draw Functions]------------------------------*/
/*----------------------------------------------------------------------------*/

// Draws a circle
function drawCircle(context, x, y) {
    context.beginPath();
    context.arc(x, y, 10, 0, 2 * Math.PI, false);
    context.closePath();
    context.fillStyle = 'green';
    context.fill();
    context.strokeStyle = '#003300';
    context.stroke();
}

// Draws a turtle
function drawTurtle(context, x, y, angle, character) {
  var turtle_image = img;
  context.save();

  //Set the origin to the center of the image
  context.translate(x, y);
  //Rotate the canvas around the origin
  context.rotate(angle);
  //draw the image
  context.drawImage(turtle_image,imageWidth / 2 * (-1),imageHeight / 2 * (-1),imageWidth,imageHeight);

  context.restore();
}

// Draws the character's view in front of the character
function drawView(canvas, character) {
    canvas.globalCompositeOperation = "destination-out";
    var mouseX = character.move_to.x;
    var mouseY = character.move_to.y;
    var character_direction = characterAngle(character);

    var w = mouseX - character.pos.x;
    var h = mouseY - character.pos.y;
    var hypo = Math.sqrt((w * w) + (h * h));

    var xratio = w / hypo;
    var yratio = h / hypo;

    var arcCenterX = character.pos.x + (xratio * view_radius);
    var arcCenterY = character.pos.y + (yratio * view_radius);

    var arcS = character_direction - view_angle;
    var arcE = character_direction + view_angle;

    var left = transposePoint(arcCenterX, arcCenterY, character.pos.x, character.pos.y, view_angle);
    var right = transposePoint(arcCenterX, arcCenterY, character.pos.x, character.pos.y, -view_angle);

    canvas.beginPath();
    canvas.arc(character.pos.x, character.pos.y, view_radius, arcS, arcE, false);
    var grd=canvas.createRadialGradient(character.pos.x,character.pos.y,view_radius * 0.90, character.pos.x,character.pos.y,view_radius);
    grd.addColorStop(0,"#ccff00");
    grd.addColorStop(1,"transparent");

    canvas.moveTo(character.pos.x, character.pos.y);
    canvas.lineTo(left.x, left.y);
    canvas.lineTo(right.x, right.y);
    canvas.closePath();
    canvas.fillStyle = grd;
    canvas.fill();
    canvas.lineWidth = 1;
    canvas.strokeStyle = grd;
    canvas.stroke();

    canvas.globalCompositeOperation = "source-over";
}

// Draws the leaderboard on the canvas
function drawLeaderboard(canvas) {
    if (cached_leaderboard.length == 0) {
        return;
    }

    var lbHeight = (cached_leaderboard.length * 18) + 29;
    var lbWidth = 250;

    canvas.fillStyle = 'rgba(240, 240, 240, 0.6)';
    canvas.fillRect(5, 5, lbWidth, lbHeight);
    canvas.strokeStyle = 'rgba(44, 44, 44, 0.95)';
    canvas.strokeRect(5,5, lbWidth, lbHeight);
    canvas.lineWidth = 5;
    canvas.font = '20px Hack';
    canvas.fillStyle = 'rgba(50, 50, 50, 1.0)';
    canvas.fillText('Leaderboard', 10, 25);
    canvas.font = '16px Hack';
    var x = 10;
    var y = 43;
    for (leader in cached_leaderboard) {
        var name = cached_leaderboard[leader].name;
        var leader_msg = (parseInt(leader) + 1).toString() + '. ' + name + "  Score: " + cached_leaderboard[leader].score;
        canvas.fillText(leader_msg, x, y);
        y += 18;
    }
    canvas.lineWidth = 1;
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*----------------------------[Animation Functions]---------------------------*/
/*----------------------------------------------------------------------------*/

// Animates the attack sequence
function attackAnimation(imgSet, special) {
  if (special) {
    if (imgSet == 0) {
      img = special_attack_img_a;
      setTimeout(function() {attackAnimation(1, special)}, 100);
    }
    else if (imgSet == 1) {
      img = special_attack_img_b;
      setTimeout(function() {attackAnimation(2, special)}, 100);
    }
    else if (imgSet == 2){
      img = special_attack_img_a;
      setTimeout(function() {attackAnimation(3, special)}, 100);
    }
    else {
      img = normal_img;
    }
  }
  else {
    if (imgSet == 0) {
      img = attack_img_a;
      setTimeout(function() {attackAnimation(1, special)}, 100);
    }
    else if (imgSet == 1) {
      img = attack_img_b;
      setTimeout(function() {attackAnimation(2, special)}, 100);
    }
    else if (imgSet == 2){
      img = attack_img_a;
      setTimeout(function() {attackAnimation(3, special)}, 100);
    }
    else {
      img = normal_img;
    }
  }
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*---------------------------[Calculation Functions]--------------------------*/
/*----------------------------------------------------------------------------*/

// Transposes a point
function transposePoint(x, y, originX, originY, theta) {
    x = x - originX;
    y = y - originY;
    var newX = (Math.cos(theta) * x) - (Math.sin(theta) * y);
    var newY = (Math.sin(theta) * x) + (Math.cos(theta) * y);
    return {x: newX + originX, y: newY + originY};
}

// Checks if a point is in range of the character
function checkPointInRange(character, x, y) {
    var xDistance = x - character.pos.x;
    var yDistance = y - character.pos.y;
    var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

    var character_direction = characterAngle(character);
    var point_angle = pointToAngle(x, y, character.pos.x, character.pos.y);

    var facing_player = (point_angle >= (character_direction - view_angle));
    facing_player &= (point_angle <= (character_direction + view_angle));

    return (distance <= view_radius) && facing_player;
}

// Calculates the angle from one point to another
function pointToAngle(x, y, originX, originY) {
    var dx = x - originX;
    var dy = y - originY;
    var theta = Math.atan2(dy, dx);
    if (theta < 0) {
        theta += (2 * Math.PI);
    }
    return theta;
}

// Returns the angle that the character should be facing
function characterAngle(character) {
    var mouseX = character.move_to.x;
    var mouseY = character.move_to.y;
    return pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y);
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*----------------------------[Movement Functions]----------------------------*/
/*----------------------------------------------------------------------------*/

// Moves the character and/or the viewOrigin by a certain amount
function moveCharacter(character, new_x, new_y, viewOrigin) {
    // X
    var viewPortDeltaX = 0;
    if ((new_x >= width-border) && ((viewOrigin.left + width) + (new_x - character.pos.x) < mapWidth) && (character.pos.x < new_x)) {
        viewPortDeltaX = new_x - character.pos.x;
        character.pos.x = width-border;
        viewOrigin.left += viewPortDeltaX;
        character.move_to.x -= viewPortDeltaX;
    }
    else if ((new_x <= border) && ((viewOrigin.left - (character.pos.x - new_x)) > 0) && (character.pos.x > new_x)) {
        viewPortDeltaX = character.pos.x - new_x;
        character.pos.x = border;
        viewOrigin.left -= viewPortDeltaX;
        character.move_to.x += viewPortDeltaX;
    }
    else if ((new_x >= width-border) && ((viewOrigin.left + width) + (new_x - character.pos.x) >= mapWidth)) {
        viewPortDeltaX = (mapWidth - width) - viewOrigin.left;
        character.pos.x += (new_x - character.pos.x) - viewPortDeltaX;
        viewOrigin.left = mapWidth - width;
        character.move_to.x -= viewPortDeltaX;
    }
    else if ((new_x <= border) && (viewOrigin.left - (character.pos.x - new_x) <= 0)) {
        viewPortDeltaX = viewOrigin.left;
        character.pos.x = new_x - viewOrigin.left;
        viewOrigin.left = 0;
        character.move_to.x += viewPortDeltaX;
    }
    else if ((new_x < width) && (new_x > 0)) {
      character.pos.x = new_x;
    }
    else if (new_x <= 0) {
        character.pos.x = 0;
    }
    else if (new_x >= width) {
        character.pos.x = width;
    }

    // Y
    var viewPortDeltaY = 0;
    if ((new_y >= height-border) && ((viewOrigin.top + height) + (new_y - character.pos.y) < mapHeight) && (character.pos.y < new_y)) {
        viewPortDeltaY = new_y - character.pos.y;
        character.pos.y = height-border;
        viewOrigin.top += viewPortDeltaY;
        character.move_to.y -= viewPortDeltaY;
    }
    else if ((new_y <= border) && ((viewOrigin.top - (character.pos.y - new_y)) > 0) && (character.pos.y > new_y)) {
        viewPortDeltaY = character.pos.y - new_y;
        character.pos.y = border;
        viewOrigin.top -= viewPortDeltaY;
        character.move_to.y += viewPortDeltaY;
    }
    else if ((new_y >= height-border) && ((viewOrigin.top + height) + (new_y - character.pos.y) >= mapHeight)) {
        viewPortDeltaY = (mapHeight - height) - viewOrigin.top;
        character.pos.y += (new_y - character.pos.y) - viewPortDeltaY;
        viewOrigin.top = mapHeight - height;
        character.move_to.y -= viewPortDeltaY;
    }
    else if ((new_y <= border) && (viewOrigin.top - (character.pos.y - new_y) <= 0)) {
        viewPortDeltaY = viewOrigin.top;
        character.pos.y = new_y - viewOrigin.top;
        viewOrigin.top = 0;
        character.move_to.y += viewPortDeltaY;
    }
    else if ((new_y < height) && (new_y > 0)) {
      character.pos.y = new_y;
    }
    else if (new_y <= 0) {
        character.pos.y = 0;
    }
    else if (new_y >= height) {
        character.pos.y = height;
    }

}

// Moves the character towards the mouse pointer
function moveCharacterTowardsCursor(character, mouseX, mouseY, viewOrigin){
   character.pos.angle = pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y) + deg90
   character.move_to.x = mouseX;
   character.move_to.y = mouseY;
   var xDistance = mouseX - character.pos.x;
   var yDistance = mouseY - character.pos.y;
   var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
   if (distance > 1) {
        var new_pos_x = character.pos.x + xDistance * 0.015;
        var new_pos_y = character.pos.y + yDistance * 0.015;
        moveCharacter(character, new_pos_x, new_pos_y, viewOrigin);
   }

}

// Moves the background image with the viewOrigin
function moveBackground(canvas, viewOrigin) {
  canvas.style.backgroundPosition = '-' + viewOrigin.left.toString() + 'px -' + viewOrigin.top.toString() + 'px';
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*------------------------------[Game Functions]------------------------------*/
/*----------------------------------------------------------------------------*/

// Reset the game
function resetGame() {
  var setupDiv = document.getElementById('setupDiv');

  setupDiv.innerHTML ='<form action="" method="get" id="nameform" align="center"> \
  Username: <input maxlength="10" type="text" name="username" id="username"> \
    <input type="button" onclick="loadGame()" value="Start"> \
  </form>';
  var usernameTb = document.getElementById('username');
  usernameTb.value = username;
}

// Checks if character has special
function checkSpecial(character) {
  if (character.pos.special) {
    img = special_img;
  }
}

// Loads the game and main function for the game operations
function loadGame() {
    // Global Game Variables
    var setupDiv = document.getElementById('setupDiv');
    var usernameTb = document.getElementById('username');
    var canvas  = document.getElementById('game');
    var scoreBoard  = document.getElementById('score');
    var context = canvas.getContext('2d');
    var socket  = io.connect();
    var connected = true;

    var specials = [];
    var viewOrigin = { top:0 , left:0 };
    var character = {
        move_to:{x:0,y:0},
        move: false,
        name: false,
        id: false,
        pos: {x:0, y:0, angle: 0, special:false}
    };

    // Setting up Canvas and HTML page
    canvas.width = width;
    canvas.height = height;
    username = usernameTb.value;
    setupDiv.innerHTML = '<p align="center">Username: ' + username + '</p>';

    // Character Attack Detection
    canvas.onmousemove = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        moveCharacterTowardsCursor(character, mouseX, mouseY, viewOrigin);
        character.move = true;
    };

    // Character Move Detection
    canvas.onmousedown = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();

        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        var attack_radius = 80.0;
        var w = mouseX - character.pos.x;
        var h = mouseY - character.pos.y;
        var hypo = Math.sqrt((w * w) + (h * h));

        var xratio = w / hypo;
        var yratio = h / hypo;

        var attackX = character.pos.x + (xratio * attack_radius);
        var attackY = character.pos.y + (yratio * attack_radius);

        var attack_position = {x: attackX+viewOrigin.left, y: attackY+viewOrigin.top};

        var attack = {id: character.id, attack: attack_position, type: 'A'};
        if (character.pos.special) {
            attack.type = 'B';
            character.pos.special = false;
            attackAnimation(0, true);

        }
        else {
          attackAnimation(0, false);
        }
        socket.emit('attack',attack);
        document.getElementById('attack_sound').play();
    };

    // Handler for updating character information of other players
    socket.on('update_characters', function (all_characters) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.lineWidth = 1;
        moveBackground(canvas,viewOrigin);
        context.rect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(47, 79, 79, 0.80)';
        context.fill();
        context.strokeStyle = '#000000';
        context.stroke();

        // Draws the view in front of the character
        drawView(context, character);
        // Draws the player
        drawTurtle(context, character.pos.x, character.pos.y, character.pos.angle, character);
        // Draws other players if they are in the view
        for (var i in all_characters) {
            other = all_characters[i];
            other.x -= viewOrigin.left;
            other.y -= viewOrigin.top;
            if (i != character.id && checkPointInRange(character, other.x, other.y)) {
                drawTurtle(context, other.x, other.y, other.angle);
            }
            if (i == character.id) {
              scoreBoard.innerHTML = all_characters[i].score.toString();
            }
        }
        // Draws specials if they are in the view
        for (var j in specials) {
            var specialX = specials[j].x - viewOrigin.left;
            var specialY = specials[j].y - viewOrigin.top;

            if (checkPointInRange(character, specialX, specialY)) {
              drawCircle(context, specialX, specialY);
            }
        }
        // Draws the leaderboard
        drawLeaderboard(context);
    });

    // Handler for updating the leaderboard
    socket.on('update_leaderboard', function(leaderboard) {
        cached_leaderboard = leaderboard;
    });

    // Handler when character gets killed
    socket.on('character_died', function () {
        resetGame();
        connected = false;
        scoreBoard.innerHTML = "DEAD";
        context.clearRect(0, 0, canvas.width, canvas.height);
        socket.disconnect();
        document.getElementById('death_sound').play();
    });

    // Handler for special detection
    socket.on('got_special', function () {
        character.pos.special = true;
        setTimeout(function() {checkSpecial(character)}, 300);
    });

    // Main Loop that runs every 25ms (40fps)
    function mainLoop() {

        // Moves the character
        if (character.move) {
            moveCharacterTowardsCursor(character,character.move_to.x,character.move_to.y, viewOrigin);
        }

        // Transmit character movement to server
        if (character.id) {
            var correctedCharacter = {
                move_to:{x:character.move_to.x,y:character.move_to.y},
                move: character.move,
                id: character.id,
                pos: {x:character.pos.x+viewOrigin.left, y:character.pos.y+viewOrigin.top, angle: character.pos.angle, special:character.pos.special, name:character.name}
            };
            socket.emit('move_character', correctedCharacter);
        }

        // Cycle the loop if connected
        if (connected) {
          setTimeout(mainLoop, 25);
        }
    }

    // Handler for updating specials' locations
    socket.on('update_specials', function(data) {
      specials = data;
    });

    // Handler for initializing the character on connect and starts Main Loop
    socket.on('init_character', function(data) {
        character.id = data.id;
        if (data.pos.x < width/2) {
          character.pos.x = data.pos.x;
        }
        else if ((data.pos.x >= width/2) && (data.pos.x < (width*3)/2)) {
          character.pos.x = width/2;
          viewOrigin.left = data.pos.x - width/2;
        }
        else if (data.pos.x >= (width*3)/2) {
          viewOrigin.left = mapWidth - width;
          character.pos.x = data.pos.x - viewOrigin.left;
        }

        if (data.pos.y < height/2) {
          character.pos.y = data.pos.y;
        }
        else if ((data.pos.y >= height/2) && (data.pos.y < (height*3)/2)) {
          character.pos.y = height/2;
          viewOrigin.top = data.pos.y - height/2;
        }
        else if (data.pos.y >= (height*3)/2) {
          viewOrigin.top = mapHeight - height;
          character.pos.y = data.pos.y - viewOrigin.top;
        }

        character.pos.angle = data.pos.angle;
        character.name = username;
        moveBackground(canvas, viewOrigin);
        document.getElementById('enter_sound').play();
        socket.emit('init_name',character.name);
        mainLoop();
    });
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/
