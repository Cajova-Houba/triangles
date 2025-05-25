const POINT_COUNT = 30;
const WIDTH = 510;
const HEIGHT = 510;
const GAME_WIDHT = 500;
const GAME_HEIGHT = 500;
const CANVAS_ID = "mainCanvas";
const PLAYER_1_SCORE_ID = "player1Score";
const PLAYER_2_SCORE_ID = "player2Score";
const POINT_WIDTH = 8;
const POINT_COMPARE_DELTA = 0.1;
const PLAYER_COLORS = ["red", "blue"];
const PLAYER_FILL_COLORS = [
    "rgba(255,0,0,0.5)", 
    "rgba(0,0,255,0.5)"
];

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

    displayScore(GAME_STATE);
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
        points[i] = [Math.floor(Math.random() * GAME_WIDHT), Math.floor(Math.random() * GAME_HEIGHT)]
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

    if (gameState.triangles) {
        gameState.triangles.forEach(triangle => {
            ctx.fillStyle = PLAYER_FILL_COLORS[triangle[3]];
            const path = new Path2D();
            path.moveTo(triangle[0][0], triangle[0][1]);
            path.lineTo(triangle[1][0], triangle[1][1]);
            path.lineTo(triangle[2][0], triangle[2][1]);
            ctx.fill(path);
        })
    }

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

function displayScore(gameState) {
    let p1 = 0;
    let p2 = 0;

    if (gameState.triangles) {
        for (let triangle of gameState.triangles) {
            if (triangle[3] == 0) {
                p1 = p1 + 1;
            } else if (triangle[3] == 1) {
                p2 = p2 + 1;
            }
        }
    }

    document.getElementById(PLAYER_1_SCORE_ID).innerHTML = p1;
    document.getElementById(PLAYER_2_SCORE_ID).innerHTML = p2;
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

        const currentPlayer = GAME_STATE.turn % 2;
        // new line = [from, to, player id]
        const newLine = [GAME_STATE.selectedPoint, selectedPoint, currentPlayer];
        
        // check if the lines is valid
        if (checkLineIntersection(newLine, GAME_STATE.lines)) {
            console.log(`Intersection for line ${newLine} found`)
        } else {
            // line is valid => store it, player's turn is done
            GAME_STATE.lines.push(newLine);
            GAME_STATE.selectedPoint = null;

            // check if the current lines closes a triangle
            const triangles = checkTriangle(GAME_STATE.lines)
            if (triangles) {
                for (let triangle of triangles) {
                    console.log(`Player ${currentPlayer} found triangle: ${triangle}`);
                    if (!GAME_STATE.triangles) {
                        GAME_STATE.triangles = [];
                    }
                    // new triangle = [A, B, C, player id]
                    GAME_STATE.triangles.push([triangle[0], triangle[1], triangle[2], currentPlayer]);
                }
            }

            turnFinished = true;
        }
    }

    displayScore(GAME_STATE);
    draw(getCanvasContext(), GAME_STATE);

    // player's turn finished, increment the turn counters
    if (turnFinished) {
        GAME_STATE.turn = GAME_STATE.turn + 1;
    }
}

/**
 * Check if the last line in given list list of lines closes a new triangle.
 * @param {Array} lines lines.
 */
function checkTriangle(lines) {
    if (lines.length < 3) {
        false;
    }

    const lastLine = lines[lines.length-1];

    // last lines is from point A to point B
    // if we find the path B->A->X->B, we have a triangle
    // that means we need to find 2 lines - [A,X] and [X,B]
    const a = lastLine[0];
    const b = lastLine[1];

    // convert lines to a map of point => lines that start or end in given point
    const pointToLines = new Map();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const p1 = line[0];
        const p2 = line[1];
        
        if (!pointToLines.has(p1)) {
            pointToLines.set(p1, []);
        }

        if (!pointToLines.has(p2)) {
            pointToLines.set(p2, []);
        }

        pointToLines.get(p1).push(line);
        pointToLines.get(p2).push(line);
    }

    const triangles = [];

    // iterate over points and try to find X so that lines 1:[A,X] and 2:[X,B] exist
    for (let [key, value] of pointToLines) {
        const pointX = key;
        const lines = value;

        // point X has to be different from A and B
        if (arePointsSame(pointX, a) || arePointsSame(pointX, b)) {
            continue;
        }

        let lineFromPointX1 = null;
        let lineFromPointX2 = null;

        for (const line of lines) {
            const p1 = line[0];
            const p2 = line[1];
            if (arePointsSame(a, p1) || arePointsSame(a, p2)) {
                lineFromPointX1 = line;
            }

            if (arePointsSame(b, p1) || arePointsSame(b, p2)) {
                lineFromPointX2 = line;
            }
        }

        if (lineFromPointX1 != null && lineFromPointX2 != null) {
            const triangle = new Set();
            triangle.add(lineFromPointX1[0]);
            triangle.add(lineFromPointX1[1]);
            triangle.add(lineFromPointX2[0]);
            triangle.add(lineFromPointX2[1]);
            triangle.add(lastLine[0]);
            triangle.add(lastLine[1]);
            triangles.push(Array.from(triangle));
        }
    }

    if (triangles.length == 0) {
        return false;
    } else {
        return triangles;
    }
}

function pointToString(point) {
    return point[0]+","+point[1];
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
                !arePointsSame(newLine[0], intersectionPoint) &&
                !arePointsSame(newLine[1], intersectionPoint) &&
                !arePointsSame(currentLine[0], intersectionPoint) &&
                !arePointsSame(currentLine[1], intersectionPoint)
            ) {
                return true;
            }
        }
    };

    return false;
}

function arePointsSame(p1, p2) {
    return Math.abs(p1[0] - p2[0]) < POINT_COMPARE_DELTA 
        && Math.abs(p1[1] - p2[1]) < POINT_COMPARE_DELTA;
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