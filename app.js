const POINT_COUNT = 30;
const WIDTH = 510;
const HEIGHT = 510;
const GAME_WIDHT = 500;
const GAME_HEIGHT = 500;
const CANVAS_ID = "mainCanvas";
const POINT_WIDTH = 8;
const POINT_COMPARE_DELTA = 0.1;
const PLAYER_COLORS = ["red", "blue"];

let GAME_STATE = {};

function resetGame() {
    const canvas = document.getElementById(CANVAS_ID);
    canvas.addEventListener("click", handleCanvasClick, false);
    const ctx = canvas.getContext("2d");

    GAME_STATE = {};
    points = generateRandomPoints();
    GAME_STATE.points = points;
    GAME_STATE.turn = 0;
    GAME_STATE.initialized = true;

    draw(ctx, GAME_STATE);
}

function getCanvasContext() {
    const canvas = document.getElementById(CANVAS_ID);
    return canvas.getContext("2d");
}

function cleanCanvas(ctx) {
    ctx.clearRect(0,0,WIDTH, HEIGHT);
    ctx.strokeStyle = "black";
    ctx.strokeRect(0,0, WIDTH, HEIGHT);
}

function generateRandomPoints() {
    let points = [POINT_COUNT];

    for (let i = 0; i < POINT_COUNT; i++) {
        points[i] = [Math.random() * GAME_WIDHT, Math.random() * GAME_HEIGHT]
    }

    return points;
}

function isGameStateInitialized(gameState) {
    return gameState != null && gameState.initialized == true
}

function draw(ctx, gameState) {
    if (!isGameStateInitialized(gameState)) {
        console.log("Game state not initialized");
        return;
    }

    cleanCanvas(ctx);

    if (gameState.lines) {
        gameState.lines.forEach(line => {
            ctx.strokeStyle = PLAYER_COLORS[line[2]];
            ctx.beginPath();
            ctx.moveTo(line[0][0], line[0][1]);
            ctx.lineTo(line[1][0], line[1][1]);
            ctx.stroke();
        })
    }

    gameState.points.forEach(point => {
        ctx.fillStyle = "black";
        ctx.fillRect(point[0] - (POINT_WIDTH/2), point[1] - (POINT_WIDTH/2), POINT_WIDTH, POINT_WIDTH)
        if (point == gameState.selectedPoint) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(point[0] - (POINT_WIDTH/2), point[1] - (POINT_WIDTH/2), POINT_WIDTH, POINT_WIDTH);
        }
    });
}

function handleCanvasClick(event) {
    if (!isGameStateInitialized(GAME_STATE)) {
        console.log("Game state not initialized");
        return;
    }

    const x = event.offsetX;
    const y = event.offsetY;

    let selectedPoint = null;
    for (let i = 0; i < POINT_COUNT; i++) {
        const point = GAME_STATE.points[i];
        const pointMinX = point[0] - (POINT_WIDTH/2);
        const pointMinY = point[1] - (POINT_WIDTH/2);
        const pointMaxX = point[0] + (POINT_WIDTH/2);
        const pointMaxY = point[1] + (POINT_WIDTH/2);

        if (pointMinX <= x && pointMaxX >= x && pointMinY <= y && pointMaxY >= y) {
            selectedPoint = point;
            break;
        }
    }

    if (selectedPoint == null) {
        return;
    }

    console.log(`Selected point: ${selectedPoint}`);

    let turnFinished = false;

    if (!GAME_STATE.selectedPoint) {
        // first points selected
        GAME_STATE.selectedPoint = selectedPoint;
    } else {
        // second points selected
        if (!GAME_STATE.lines) {
            GAME_STATE.lines = []
        }

        // new line = [from, to, player id]
        const newLine = [GAME_STATE.selectedPoint, selectedPoint, GAME_STATE.turn % 2];
        
        // check if the lines is valid
        if (checkLineIntersection(newLine, GAME_STATE.lines)) {
            console.log(`Intersection for line ${newLine} found`)
        } else {
            // line is valid => store it, player's turn is done
            GAME_STATE.lines.push(newLine);
            GAME_STATE.selectedPoint = null;
            turnFinished = true;
        }
    }

    draw(getCanvasContext(), GAME_STATE);

    // player's turn finished, increment the turn counters
    if (turnFinished) {
        GAME_STATE.turn = GAME_STATE.turn + 1;
    }
}

function checkLineIntersection(newLine, existingLines) {
    if (existingLines.length == 0) {
        return false;
    }

    for (let i = 0; i < existingLines.length; i++) {
        const currentLine = existingLines[i];
        const intersectionPoint = intersect(
            newLine[0], newLine[1],
            currentLine[0], currentLine[1]);
        
        if (intersectionPoint instanceof Array) {
            // if the intersection point is same as one of the points that are defining the line,
            // then it's ok
            if (
                !arePointsSame(newLine[0], intersectionPoint, POINT_COMPARE_DELTA) &&
                !arePointsSame(newLine[1], intersectionPoint, POINT_COMPARE_DELTA) &&
                !arePointsSame(currentLine[0], intersectionPoint, POINT_COMPARE_DELTA) &&
                !arePointsSame(currentLine[1], intersectionPoint, POINT_COMPARE_DELTA)
            ) {
                return true;
            }
        }
    };

    return false;
}

function arePointsSame(p1, p2, delta) {
    return Math.abs(p1[0] - p2[0]) < delta && Math.abs(p1[1] - p2[1]) < delta;
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// first line is from point A to point B
// second line is from point C to point D
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(a,b,c,d) {
    const x1 = a[0];
    const y1 = a[1];
    const x2 = b[0];
    const y2 = b[1];
    const x3 = c[0];
    const y3 = c[1];
    const x4 = d[0];
    const y4 = d[1];


    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }

    denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return false
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)

    return [x, y]
}