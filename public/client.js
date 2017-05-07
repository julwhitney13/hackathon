var width   = 500;
var height  = 500;
var imageWidth = 30;
var imageHeight = 50;
var img= new Image();
img.src = "https://image.ibb.co/bKH1ak/turlte4real.png";

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

function draw_turtle(context, x, y, angle) {
  context.save();

  //Set the origin to the center of the image
  context.translate(x + imageWidth / 2, y + imageHeight / 2);
  //Rotate the canvas around the origin
  context.rotate(angle);
  //draw the image
  context.drawImage(img,imageWidth / 2 * (-1),imageHeight / 2 * (-1),imageWidth,imageHeight);

  context.restore();
}

function move_character(character, new_x, new_y) {
    if (new_x >= width) {
        character.pos.x = width;
    } else if (new_x <= -100) {
        character.pos.x = 0;
    } else {
        character.pos.x = new_x;
    }

    if (new_y >= height) {
        character.pos.y = height;
    } else if (new_y <= -100) {
        character.pos.y = 0;
    } else {
        character.pos.y = new_y;
    }
}

function move_character_towards_cursor(character, mouseX, mouseY){
   character.pos.angle = pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y) + 1.5708
   character.move_to.x = mouseX;
   character.move_to.y = mouseY;
   var xDistance = mouseX - character.pos.x;
   var yDistance = mouseY - character.pos.y;
   var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
   if (distance > 1) {
        var new_pos_x = character.pos.x + xDistance * 0.015;
        var new_pos_y = character.pos.y + yDistance * 0.015;
        move_character(character, new_pos_x, new_pos_y);
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

document.addEventListener("DOMContentLoaded", function() {
    // get canvas element and create context
    var canvas  = document.getElementById('game');
    var scoreBoard  = document.getElementById('score');
    var context = canvas.getContext('2d');
    var socket  = io.connect();

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    var character = {
        move_to:{x:0,y:0},
        move: false,
        id: false,
        pos: {x:0, y:0, angle: 0}
    };

    canvas.onmousemove = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        move_character_towards_cursor(character, mouseX, mouseY);
        character.move = true;
    };

    canvas.onmousedown = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        attack_radius = 80.0;
        w = mouseX - character.pos.x;
        h = mouseY - character.pos.y;
        hypo = Math.sqrt((w * w) + (h * h));

        xratio = w / hypo;
        yratio = h / hypo;

        attackX = character.pos.x + (xratio * attack_radius);
        attackY = character.pos.y + (yratio * attack_radius);

        attack_position = {x: attackX, y: attackY};

        var attack = {id: character.id, attack: attack_position, type: 'A'};
        socket.emit('attack', attack);
    };

    // draw line received from server
    socket.on('update_characters', function (all_characters) {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear out the canvas
        var text = "";
        for (var i in all_characters) {
            if (i == character.id) {
              scoreBoard.innerHTML = all_characters[i].score.toString();
            }
            // draw_circle(context, all_characters[i].x, all_characters[i].y);
            draw_turtle(context, all_characters[i].x, all_characters[i].y, all_characters[i].angle);
            console.log("id: " + i + " // angle: " + all_characters[i].angle.toString());
        }
    });

    socket.on('character_died', function () {
        window.location = 'https://yourwaifuisshit.com';
    });

    // main loop, running every 25ms
    function mainLoop() {
        if (character.move) {
            move_character_towards_cursor(character,character.move_to.x,character.move_to.y);
        }

        if (character.id) {
            socket.emit('move_character', character);
        }

        setTimeout(mainLoop, 25);
    }

    socket.on('init_character', function(data) {
        character.id = data.id;
        character.pos.x = data.pos.x;
        character.pos.y = data.pos.y;
        character.pos.angle = data.pos.angle;
        mainLoop();
    });
});
