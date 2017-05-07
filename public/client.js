function draw_circle(canvas, x, y) {
    canvas.beginPath();
    canvas.arc(x, y, 10, 0, 2 * Math.PI, false);
    canvas.closePath();
    canvas.fillStyle = 'green';
    canvas.fill();
    canvas.lineWidth = 5;
    canvas.strokeStyle = '#003300';
    canvas.stroke();
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

var width   = 500;
var height  = 500;

document.addEventListener("DOMContentLoaded", function() {
    // get canvas element and create context
    var canvas  = document.getElementById('game');
    var context = canvas.getContext('2d');
    var socket  = io.connect();

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    var character = {
        move: false,
        move_to: {x:0, y:0},
        id: false,
        pos: {x:0, y:0}
    };

    canvas.onmousemove = function(e) {
        move_character_towards_cursor(character, e.clientX, e.clientY);
        character.move = true;
    };

    canvas.onmousedown = function(e) {
        attack_radius = 20.0;
        w = e.clientX - character.pos.x;
        h = e.clientY - character.pos.y;
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
        console.log("update character");
        for (var i in all_characters) {
            draw_circle(context, all_characters[i].x, all_characters[i].y);
        }
    });

    socket.on('character_died', function () {
        window.location = 'https://yourwaifuisshit.com';
    });

    // main loop, running every 25ms
    function mainLoop() {
        if (character.move) {
            move_character_towards_cursor(character, character.move_to.x, character.move_to.y);
        }

        console.log(character.pos.x);
        console.log(character.pos.y);

        socket.emit('move_character', character);
        setTimeout(mainLoop, 25);
    }

    socket.on('init_character', function(data) {
        character.id = data.id;
        character.pos.x = data.pos.x;
        character.pos.y = data.pos.y;
        mainLoop();
    });
});
