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
    canvas.moveTo(character.pos.x, character.pos.y);
    canvas.lineTo(left.x, left.y);
    canvas.lineTo(right.x, right.y);
    canvas.lineTo(character.pos.x, character.pos.y)
    canvas.closePath();
    canvas.fillStyle = 'black';
    canvas.fill();
    canvas.lineWidth = 1;
    canvas.strokeStyle = '#000000';
    canvas.stroke();

    canvas.globalCompositeOperation = "source-over";
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

function characterAngle(character) {
    var mouseX = character.move_to.x;
    var mouseY = character.move_to.y;
    return pointToAngle(mouseX, mouseY, character.pos.x, character.pos.y);
   }


var width   = 500;
var height  = 500;
var view_radius = 130;
var view_angle = Math.PI * 0.33;

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
        var attack_radius = 20.0;
        var w = e.clientX - character.pos.x;
        var h = e.clientY - character.pos.y;
        var hypo = Math.sqrt((w * w) + (h * h));

        var xratio = w / hypo;
        var yratio = h / hypo;

        var attackX = character.pos.x + (xratio * attack_radius);
        var attackY = character.pos.y + (yratio * attack_radius);

        var attack_position = {x: attackX, y: attackY};

        var attack = {id: character.id, attack: attack_position, type: 'A'};
        socket.emit('attack', attack);
    };

    // draw line received from server
    socket.on('update_characters', function (all_characters) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.rect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        context.fill();
        context.strokeStyle = '#000000';
        context.stroke();

        draw_view(context, character);
        // Draw myself.
        draw_circle(context, character.pos.x, character.pos.y);
        for (var i in all_characters) {
            other = all_characters[i];
            if (i != character.id && point_in_range(character, other.x, other.y)) {
                draw_circle(context, other.x, other.y);
            }
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
