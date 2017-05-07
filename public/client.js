// var $ = require('jquery');


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

function draw_turtle(context, character, x, y) {
    // context.drawImageRot(context, img, w, h, 50, 80, );
    drawImageRot(context, img, x, y, 50, 80, character.angle);
}

function drawImageRot(context, img,x,y,width,height,deg){
    // console.log("ROTATE MOTHERFUCKER");

    // context.clearRect(0, 0, width, height);
    //Convert degrees to radian 
    var rad = (deg + 90) * Math.PI / 180;

    context.save();

    //Set the origin to the center of the image
    context.translate(x + width / 2, y + height / 2);

    //Rotate the canvas around the origin
    context.rotate(rad);

    //draw the image    
    context.drawImage(img,width / 2 * (-1),height / 2 * (-1),width,height);

    //reset the canvas  
    context.rotate(rad * ( -1 ) );
    context.translate((x + width / 2) * (-1), (y + height / 2) * (-1));
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
    var rect = document.getElementById('game').getBoundingClientRect();
    character.move_to.x = mouseX;
    character.move_to.y = mouseY;
    var xDistance = mouseX - character.pos.x - rect.left;
    var yDistance = mouseY - character.pos.y - rect.top;
    var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
    if (distance > 1) {
        var new_pos_x = character.pos.x + xDistance * 0.015;
        var new_pos_y = character.pos.y + yDistance * 0.015;
        move_character(character, new_pos_x, new_pos_y);
        // drawImageRot(context, img, new_pos_x, new_pos_y, 50, 80, angleDeg);
    }
    character.angle = Math.atan2(mouseY - new_pos_y, mouseX - new_pos_x) * 180 / Math.PI;
}

var width   = 500;
var height  = 500;
var img= new Image();
img.src = "https://image.ibb.co/bKH1ak/turlte4real.png";


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
        move: false,
        move_to: {x:0, y:0},
        id: false,
        pos: {x:0, y:0},
        angle: 0
    };

    canvas.onmousemove = function(e) {
        move_character_towards_cursor(context, character, e.clientX, e.clientY);
        character.move = true;
    };

    canvas.onmousedown = function(e) {
        var rect = document.getElementById('game').getBoundingClientRect();
        attack_radius = 20.0;
        w = e.clientX - (character.pos.x + rect.left);
        h = e.clientY - (character.pos.y + rect.top);
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
            draw_turtle(context, all_characters[i], all_characters[i].x, all_characters[i].y);
            // draw_circle(context, all_characters[i].x, all_characters[i].y);
        }
    });

    socket.on('character_died', function () {
        window.location = 'https://yourwaifuisshit.com';
    });

    // main loop, running every 25ms
    function mainLoop() {
        if (character.move) {
            move_character_towards_cursor(context, character, character.move_to.x, character.move_to.y);
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
        mainLoop();
    });
});
