var img= new Image();
var view_radius = 130;
var view_angle = Math.PI * 0.33;
const width = 1200;
const height = 600;
const imageWidth = 50;
const imageHeight = 80;
const deg90 = 1.5708;
const border = 200;
const mapWidth = 2400;
const mapHeight = 1200;
var username = "";
img.src = "https://image.ibb.co/bKH1ak/turlte4real.png";

// Create sprite sheet
var turtleImage = new Image();    
turtleImage.src = "https://preview.ibb.co/gTjHFk/turtle_Sprite_Sheet.png";
turtleImage.addEventListener("load", loadGame);

(function() {
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    // MIT license

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


function sprite (options) {

    var that = {},
        frameIndex = 0,
        tickCount = 0,
        ticksPerFrame = options.ticksPerFrame || 0,
        numberOfFrames = options.numberOfFrames || 1;
    
    that.context = options.context;
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;
    
    that.update = function () {

        tickCount += 1;

        if (tickCount > ticksPerFrame) {

            tickCount = 0;
            
            // If the current frame index is in range
            if (frameIndex < numberOfFrames - 1) {  
                // Go to the next frame
                frameIndex += 1;
            } else {
                frameIndex = 0;
            }
        }
    };
    
    that.render = function (context) {
    
      // Clear the canvas
      // that.context.clearRect(0, 0, that.width, that.height);
      
      // Draw the animation
      context.save();
      context.drawImage(
        turtleImage,
        frameIndex * that.width / numberOfFrames,
        0,
        that.width / numberOfFrames,
        that.height,
        that.width / 2 * (-1),
        that.height / 2 * (-1),
        that.width / numberOfFrames,
        that.height);
      context.restore();
      console.log("render");
    };

    that.draw = function (context, x, y, angle) {
        context.save();

        //Set the origin to the center of the image
        context.translate(x, y);
        //Rotate the canvas around the origin
        context.rotate(angle);
        //draw the image
        context.drawImage(img, imageWidth / 2 * (-1), imageHeight / 2 * (-1), imageWidth, imageHeight);

        context.restore();
    };
    
    return that;
}



// Load sprite sheet
// coinImage.addEventListener("onmousedown", gameLoop);


function draw_circle(context, x, y) {
    context.beginPath();
    context.arc(x, y, 10, 0, 2 * Math.PI, false);
    context.closePath();
    context.fillStyle = 'green';
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = '#003300';
    context.stroke();
}

function draw_turtle(turtleSprite, context, x, y, angle) {
  context.save();

  //Set the origin to the center of the image
  context.translate(x, y);
  //Rotate the canvas around the origin
  context.rotate(angle);
  //draw the image
  context.drawImage(turtleSprite, imageWidth / 2 * (-1),imageHeight / 2 * (-1),imageWidth,imageHeight);

  context.restore();
}

function transpose_point(x, y, originX, originY, theta) {
    x = x - originX;
    y = y - originY;
    var newX = (Math.cos(theta) * x) - (Math.sin(theta) * y);
    var newY = (Math.sin(theta) * x) + (Math.cos(theta) * y);
    return {x: newX + originX, y: newY + originY};
}

function point_in_range(character, x, y) {
    var xDistance = x - character.pos.x;
    var yDistance = y - character.pos.y;
    var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

    var character_direction = characterAngle(character);
    var point_angle = pointToAngle(x, y, character.pos.x, character.pos.y);

    var facing_player = (point_angle >= (character_direction - view_angle));
    facing_player &= (point_angle <= (character_direction + view_angle));

    return (distance <= view_radius) && facing_player;
}

function draw_view(canvas, character) {
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

    var left = transpose_point(arcCenterX, arcCenterY, character.pos.x, character.pos.y, view_angle);
    var right = transpose_point(arcCenterX, arcCenterY, character.pos.x, character.pos.y, -view_angle);

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
    canvas.lineWidth = 0;
    canvas.strokeStyle = grd;
    canvas.stroke();

    canvas.globalCompositeOperation = "source-over";
}

function move_character(character, new_x, new_y, viewOrigin) {
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

function move_character_towards_cursor(character, mouseX, mouseY, viewOrigin){
   character.pos.angle = pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y) + deg90
   character.move_to.x = mouseX;
   character.move_to.y = mouseY;
   var xDistance = mouseX - character.pos.x;
   var yDistance = mouseY - character.pos.y;
   var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
   if (distance > 1) {
        var new_pos_x = character.pos.x + xDistance * 0.015;
        var new_pos_y = character.pos.y + yDistance * 0.015;
        move_character(character, new_pos_x, new_pos_y, viewOrigin);
   }

}

function pointToAngle(x, y, originX, originY) {
    var dx = x - originX;
    var dy = y - originY;
    var theta = Math.atan2(dy, dx);
    if (theta < 0) {
        theta += (2 * Math.PI);
    }
    return theta;
}

function characterAngle(character) {
    var mouseX = character.move_to.x;
    var mouseY = character.move_to.y;
    return pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y);
}

function resetGame() {
  var setupDiv = document.getElementById('setupDiv');

  setupDiv.innerHTML ='<form action="" method="get" id="nameform" align="center"> \
  Username: <input type="text" name="username" id="username"> \
    <input type="button" onclick="loadGame()" value="Start"> \
  </form>';
  var usernameTb = document.getElementById('username');
  usernameTb.value = username;
}

var attacking = false;
function loadGame() {
    // get canvas element and create context
    var setupDiv = document.getElementById('setupDiv');
    var usernameTb = document.getElementById('username');
    var canvas  = document.getElementById('game');
    var scoreBoard  = document.getElementById('score');
    var context = canvas.getContext('2d');
    var socket  = io.connect();
    var connected = true;
    var turtleSprite = sprite({
            context: context,
            width: imageWidth * 3,
            height: imageHeight,
            image: turtleImage,
            numberOfFrames: 3,
            ticksPerFrame: 20
    });

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    var character = {
        move_to:{x:0,y:0},
        move: false,
        id: false,
        pos: {x:0, y:0, angle: 0}
    };

    var viewOrigin = {
        top:0,
        left:0
    }
    username = usernameTb.value;
    setupDiv.innerHTML = '<p align="center">Username: ' + username + '</p>';

    canvas.onmousemove = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        move_character_towards_cursor(character, mouseX, mouseY, viewOrigin);
        character.move = true;
    };

    canvas.onmousedown = function(e) {
                // Create sprite
        attacking = true;
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
        socket.emit('attack',attack);

        document.getElementById('attack_sound').play();

        console.log("down");
    };

    canvas.onmouseup = function(e) {
        console.log("up");
        attacking = false;
    }

    // draw line received from server
    socket.on('update_characters', function (all_characters) {


        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.backgroundPosition = '-' + viewOrigin.left.toString() + 'px -' + viewOrigin.top.toString() + 'px';
        context.rect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(47, 79, 79, 0.80)';
        context.fill();
        context.strokeStyle = '#000000';
        context.stroke();

        draw_view(context, character);
        // Draw myself.

        // turtleSprite.draw(context, character.pos.x, character.pos.y, character.pos.angle);
        if (attacking) {
            turtleSprite.update();
            turtleSprite.render(context);
            console.log("HERE");
        } else {
            turtleSprite.draw(context, character.pos.x, character.pos.y, character.pos.angle);
            // draw_turtle(turtleSprite, context, character.pos.x, character.pos.y, character.pos.angle);
        }

        for (var i in all_characters) {
            other = all_characters[i];
            other.x -= viewOrigin.left;
            other.y -= viewOrigin.top;
            if (i != character.id && point_in_range(character, other.x, other.y)) {
                turtleSprite.draw(context, other.x, other.y, other.angle);
                // draw_turtle(turtleSprite, context, other.x, other.y, other.angle);
            }
            if (i == character.id) {
              scoreBoard.innerHTML = all_characters[i].score.toString();
            }
        }
    });

    socket.on('character_died', function () {
        resetGame();
        connected = false;
        scoreBoard.innerHTML = "DEAD";
        context.clearRect(0, 0, canvas.width, canvas.height);
        socket.disconnect();
        document.getElementById('death_sound').play();
    });

    // main loop, running every 25ms
    function mainLoop() {
        if (character.move) {
            move_character_towards_cursor(character,character.move_to.x,character.move_to.y, viewOrigin);
        }

        if (character.id) {
            var correctedCharacter = {
                move_to:{x:character.move_to.x,y:character.move_to.y},
                move: character.move,
                id: character.id,
                pos: {x:character.pos.x+viewOrigin.left, y:character.pos.y+viewOrigin.top, angle: character.pos.angle}
            };
            socket.emit('move_character', correctedCharacter);
        }

        if (connected) {
          setTimeout(mainLoop, 25);
        }
    }

    socket.on('init_character', function(data) {
        character.id = data.id;
        character.pos.x = data.pos.x;
        character.pos.y = data.pos.y;
        character.pos.angle = data.pos.angle;
        document.getElementById('enter_sound').play();
        mainLoop();
    });
}
