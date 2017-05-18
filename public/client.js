var img = new Image();
var others = new Image();
var normalImg= new Image();
var attackImgA = new Image();
var attackImgB = new Image();
var specialImg = new Image();
var specialAttackImgA = new Image();
var specialAttackImgB = new Image();

var viewRadius = 200;
var viewAngle = Math.PI * 0.33;
var cachedLeaderboard = [];

const width = 1200;
const height = 600;
const imageWidth = 50;
const imageHeight = 80;
const deg90 = 1.5708;
const border = 200;
const mapWidth = 2400;
const mapHeight = 1200;
var username = "";
normalImg.src = "image/1.png";
attackImgA.src = "image/2.png";
attackImgB.src = "image/3.png";
specialImg.src = "image/s1.png";
specialAttackImgA.src = "image/s2.png";
specialAttackImgB.src = "image/s3.png";
img = normalImg;
others = normalImg;

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
  if (character) {
      var turtleImage = img;
  }
  else {
      var turtleImage = normalImg;
  }

  context.save();

  //Set the origin to the center of the image
  context.translate(x, y);
  //Rotate the canvas around the origin
  context.rotate(angle);
  //draw the image
  context.drawImage(turtleImage,imageWidth / 2 * (-1),imageHeight / 2 * (-1),imageWidth,imageHeight);

  context.restore();
}

// Draws the character's view in front of the character
function drawView(canvas, character) {
    canvas.globalCompositeOperation = "destination-out";
    var mouseX = character.moveTo.x;
    var mouseY = character.moveTo.y;
    var characterDirection = characterAngle(character);

    var w = mouseX - character.pos.x;
    var h = mouseY - character.pos.y;
    var hypo = Math.sqrt((w * w) + (h * h));

    var xratio = w / hypo;
    var yratio = h / hypo;

    var arcCenterX = character.pos.x + (xratio * viewRadius);
    var arcCenterY = character.pos.y + (yratio * viewRadius);

    var arcS = characterDirection - viewAngle;
    var arcE = characterDirection + viewAngle;

    var left = transposePoint(arcCenterX, arcCenterY, character.pos.x, character.pos.y, viewAngle);
    var right = transposePoint(arcCenterX, arcCenterY, character.pos.x, character.pos.y, -viewAngle);

    canvas.beginPath();
    canvas.arc(character.pos.x, character.pos.y, viewRadius, arcS, arcE, false);
    var grd=canvas.createRadialGradient(character.pos.x,character.pos.y,viewRadius * 0.90, character.pos.x,character.pos.y,viewRadius);
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
function drawLeaderboard(context, character) {
    if (cachedLeaderboard.length == 0) {
        return;
    }

    var lbHeight = (cachedLeaderboard.length * 18) + 29;
    var lbWidth = 250;

    context.fillStyle = 'rgba(240, 240, 240, 0.6)';
    context.fillRect(5, 5, lbWidth, lbHeight);
    context.strokeStyle = 'rgba(44, 44, 44, 0.95)';
    context.strokeRect(5,5, lbWidth, lbHeight);
    context.lineWidth = 5;
    context.font = '20px Hack';
    context.fillStyle = 'rgba(50, 50, 50, 1.0)';
    context.fillText('Leaderboard', 10, 25);
    context.font = '16px Hack';
    var x = 10;
    var y = 43;
    for (leader in cachedLeaderboard) {
        var name = cachedLeaderboard[leader].name;
        if (cachedLeaderboard[leader].socketId == character.id) {
            context.font = 'bold 16px Hack';
        }
        else {
          context.font = '16px Hack';
        }
        var leaderboardLine = (parseInt(leader) + 1).toString() + '. ' + name + "  Score: " + cachedLeaderboard[leader].score;
        context.fillText(leaderboardLine, x, y);
        y += 18;
    }
    context.lineWidth = 1;
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
      img = specialAttackImgA;
      setTimeout(function() {attackAnimation(1, special)}, 100);
    }
    else if (imgSet == 1) {
      img = specialAttackImgB;
      setTimeout(function() {attackAnimation(2, special)}, 100);
    }
    else if (imgSet == 2){
      img = specialAttackImgA;
      setTimeout(function() {attackAnimation(3, special)}, 100);
    }
    else {
      img = normalImg;
    }
  }
  else {
    if (imgSet == 0) {
      img = attackImgA;
      setTimeout(function() {attackAnimation(1, special)}, 100);
    }
    else if (imgSet == 1) {
      img = attackImgB;
      setTimeout(function() {attackAnimation(2, special)}, 100);
    }
    else if (imgSet == 2){
      img = attackImgA;
      setTimeout(function() {attackAnimation(3, special)}, 100);
    }
    else {
      img = normalImg;
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

// Checks if the angle is in range of the view
function checkAngleInRange(pointAngle, character) {
    var characterDirection = characterAngle(character);
    var inRange = false;
    if ((Math.abs(pointAngle - characterDirection) <= viewAngle) || (Math.abs(pointAngle - (characterDirection + 2 * Math.PI)) <= viewAngle) || (Math.abs(pointAngle - (characterDirection - 2 * Math.PI)) <= viewAngle)) {
      inRange = true;
    }
    return inRange;
}

// Checks if a point is in range of the character
function checkPointInRange(character, x, y) {
    var xDistance = x - character.pos.x;
    var yDistance = y - character.pos.y;
    var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance)
    var pointAngle = pointToAngle(x, y, character.pos.x, character.pos.y);
    var distanceInRange = (distance <= viewRadius);
    var angleInRange = checkAngleInRange(pointAngle, character)
    return distanceInRange && angleInRange;
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
    var mouseX = character.moveTo.x;
    var mouseY = character.moveTo.y;
    return pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y);
}

/*----------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------*/
/*----------------------------[Movement Functions]----------------------------*/
/*----------------------------------------------------------------------------*/

// Moves the character and/or the viewOrigin by a certain amount
function moveCharacter(character, newX, newY, viewOrigin) {
    // X
    var viewPortDeltaX = 0;
    if ((newX >= width-border) && ((viewOrigin.left + width) + (newX - character.pos.x) < mapWidth) && (character.pos.x < newX)) {
        viewPortDeltaX = newX - character.pos.x;
        character.pos.x = width-border;
        viewOrigin.left += viewPortDeltaX;
        character.moveTo.x -= viewPortDeltaX;
    }
    else if ((newX <= border) && ((viewOrigin.left - (character.pos.x - newX)) > 0) && (character.pos.x > newX)) {
        viewPortDeltaX = character.pos.x - newX;
        character.pos.x = border;
        viewOrigin.left -= viewPortDeltaX;
        character.moveTo.x += viewPortDeltaX;
    }
    else if ((newX >= width-border) && ((viewOrigin.left + width) + (newX - character.pos.x) >= mapWidth)) {
        viewPortDeltaX = (mapWidth - width) - viewOrigin.left;
        character.pos.x += (newX - character.pos.x) - viewPortDeltaX;
        viewOrigin.left = mapWidth - width;
        character.moveTo.x -= viewPortDeltaX;
    }
    else if ((newX <= border) && (viewOrigin.left - (character.pos.x - newX) <= 0)) {
        viewPortDeltaX = viewOrigin.left;
        character.pos.x = newX - viewOrigin.left;
        viewOrigin.left = 0;
        character.moveTo.x += viewPortDeltaX;
    }
    else if ((newX < width) && (newX > 0)) {
      character.pos.x = newX;
    }
    else if (newX <= 0) {
        character.pos.x = 0;
    }
    else if (newX >= width) {
        character.pos.x = width;
    }

    // Y
    var viewPortDeltaY = 0;
    if ((newY >= height-border) && ((viewOrigin.top + height) + (newY - character.pos.y) < mapHeight) && (character.pos.y < newY)) {
        viewPortDeltaY = newY - character.pos.y;
        character.pos.y = height-border;
        viewOrigin.top += viewPortDeltaY;
        character.moveTo.y -= viewPortDeltaY;
    }
    else if ((newY <= border) && ((viewOrigin.top - (character.pos.y - newY)) > 0) && (character.pos.y > newY)) {
        viewPortDeltaY = character.pos.y - newY;
        character.pos.y = border;
        viewOrigin.top -= viewPortDeltaY;
        character.moveTo.y += viewPortDeltaY;
    }
    else if ((newY >= height-border) && ((viewOrigin.top + height) + (newY - character.pos.y) >= mapHeight)) {
        viewPortDeltaY = (mapHeight - height) - viewOrigin.top;
        character.pos.y += (newY - character.pos.y) - viewPortDeltaY;
        viewOrigin.top = mapHeight - height;
        character.moveTo.y -= viewPortDeltaY;
    }
    else if ((newY <= border) && (viewOrigin.top - (character.pos.y - newY) <= 0)) {
        viewPortDeltaY = viewOrigin.top;
        character.pos.y = newY - viewOrigin.top;
        viewOrigin.top = 0;
        character.moveTo.y += viewPortDeltaY;
    }
    else if ((newY < height) && (newY > 0)) {
      character.pos.y = newY;
    }
    else if (newY <= 0) {
        character.pos.y = 0;
    }
    else if (newY >= height) {
        character.pos.y = height;
    }

}

// Moves the character towards the mouse pointer
function moveCharacterTowardsCursor(character, mouseX, mouseY, viewOrigin){
   const speedLimit = 4.5;
   const minDistance = 10;
   var xDistance = mouseX - character.pos.x;
   var yDistance = mouseY - character.pos.y;
   var xDelta = xDistance * 0.015;
   var yDelta = yDistance * 0.015;
   var velocity = Math.sqrt(xDelta*xDelta + yDelta*yDelta);
   if (velocity > speedLimit) {
     var factor = velocity/speedLimit;
     xDelta = xDelta/factor;
     yDelta = yDelta/factor;
   }
   if (Math.abs(xDistance) + Math.abs(yDistance) > minDistance) {
        var newX = character.pos.x + xDelta;
        var newY = character.pos.y + yDelta;
        moveCharacter(character, newX, newY, viewOrigin);
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
    img = specialImg;
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
        moveTo:{x:0,y:0},
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
        character.pos.angle = pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y) + deg90
        character.moveTo.x = mouseX;
        character.moveTo.y = mouseY;
        //moveCharacterTowardsCursor(character, mouseX, mouseY, viewOrigin);
        character.move = true;
    };

    // Character Move Detection
    canvas.onmousedown = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();

        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        var strikeDistance = 80.0;
        var w = mouseX - character.pos.x;
        var h = mouseY - character.pos.y;
        var hypo = Math.sqrt((w * w) + (h * h));

        var xratio = w / hypo;
        var yratio = h / hypo;

        var attackX = character.pos.x + (xratio * strikeDistance);
        var attackY = character.pos.y + (yratio * strikeDistance);

        var attackPosition = {x: attackX+viewOrigin.left, y: attackY+viewOrigin.top};

        var attack = {id: character.id, attack: attackPosition, type: 'A'};
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
    socket.on('update_characters', function (allCharacters) {
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
        for (var i in allCharacters) {
            other = allCharacters[i];
            other.x -= viewOrigin.left;
            other.y -= viewOrigin.top;
            if (i != character.id && checkPointInRange(character, other.x, other.y)) {
                drawTurtle(context, other.x, other.y, other.angle);
            }
            if (i == character.id) {
              scoreBoard.innerHTML = allCharacters[i].score.toString();
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
        drawLeaderboard(context, character);
    });

    // Handler for updating the leaderboard
    socket.on('update_leaderboard', function(leaderboard) {
        cachedLeaderboard = leaderboard;
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
            moveCharacterTowardsCursor(character,character.moveTo.x,character.moveTo.y, viewOrigin);
        }

        // Transmit character movement to server
        if (character.id) {
            var correctedCharacter = {
                moveTo:{x:character.moveTo.x,y:character.moveTo.y},
                move: character.move,
                id: character.id,
                pos: {x:character.pos.x+viewOrigin.left, y:character.pos.y+viewOrigin.top, angle: character.pos.angle, special:character.pos.special, name:character.name}
            };
            socket.emit('move_character', correctedCharacter);
        }

        // Cycle the loop if connected
        if (connected) {
          setTimeout(mainLoop, 10);
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
