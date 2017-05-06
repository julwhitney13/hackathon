function draw_circle(canvas, x, y) {
    canvas.beginPath();
    canvas.arc(x, y, 5, 0, 2 * Math.PI, false);
    canvas.closePath();
    canvas.fillStyle = 'green';
    canvas.fill();
    canvas.lineWidth = 5;
    canvas.strokeStyle = '#003300';
    canvas.stroke();
}

var keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

document.addEventListener("keydown", function(e) {
    switch (e.keyCode) {
        case 37:
            keys.left = true;
            break;
        case 38:
            keys.up = true;
            break;
        case 39:
            keys.right = true;
            break;
        case 40:
            keys.down = true;
            break;
    }
});

document.addEventListener("keyup", function(e) {
    switch (e.keyCode) {
        case 37:
            keys.left = false;
            break;
        case 38:
            keys.up = false;
            break;
        case 39:
            keys.right = false;
            break;
        case 40:
            keys.down = false;
            break;
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // get canvas element and create context
    var canvas  = document.getElementById('game');
    var context = canvas.getContext('2d');
    var width   = 500;
    var height  = 500;
    var socket  = io.connect();

    // set canvas to full browser width/height
    canvas.width = width;
    canvas.height = height;

    var character = {
        id: false,
        pos: {x:0, y:0}
    };

    // draw line received from server
    socket.on('update_characters', function (all_characters) {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear out the canvas
        console.log("update character");
        for (var i in all_characters) {
            draw_circle(context, all_characters[i].x, all_characters[i].y);
        }
    });

    // main loop, running every 25ms
    function mainLoop() {
        // Calculate new location
        dx = keys.left ? -10 : 0;
        dx += keys.right ? 10 : 0;

        dy = keys.down ? -10 : 0;
        dy += keys.up ? 10 : 0;

        character.pos.x += dx;
        character.pos.y += dy;

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
