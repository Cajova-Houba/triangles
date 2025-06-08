const GENERATOR = {
    canvasContext: null,
    gridWidth: -1,
    gridHeight: -1,
    gridZeroPoint: [-1, -1],
    points: null,
    randomShifts: null,
    distanceX: -1,
    distanceY: -1,
    steps: -1 
}

function initGridGenerator(ctx, width, height, zeroPoint, steps, points) {
    GENERATOR.canvasContext = ctx;
    GENERATOR.gridWidth = width;
    GENERATOR.gridHeight = height;
    GENERATOR.gridZeroPoint = zeroPoint;
    GENERATOR.points = points;
    GENERATOR.randomShifts = [];
    GENERATOR.steps = steps;
    GENERATOR.currentStep = 1;
}

/**
 * Generates a grid with given points count. Draws it and then
 * uses setTimeout() for the next step.
 * 
 * Generator points are stored in a GENERATOR.gameState.
 * 
 * @param {number} pointCountX How many points to generate horizontally
 * @param {number} pointCountY How many points to generate vertically.
 */
function startGridGenerator(pointCountX, pointCountY) {

    // calculate distance between points
    GENERATOR.distanceX = GENERATOR.gridWidth / pointCountX;
    GENERATOR.distanceY = GENERATOR.gridHeight / pointCountY;

    const halfDistX = GENERATOR.distanceX / 2;
    const halfDistY = GENERATOR.distanceY / 2;

    const minX = GENERATOR.gridZeroPoint[0];
    const minY = GENERATOR.gridZeroPoint[1];
    const maxX = minX + GENERATOR.gridWidth;
    const maxY = minY + GENERATOR.gridHeight;

    for (let x = minX+halfDistX; x < maxX; x = x + GENERATOR.distanceX) {
        for (let y = minY+halfDistY; y < maxY; y = y + GENERATOR.distanceY) {
            const point = [x,y];

            // get 2 intervals
            // 1: boundaries of shift on X axis
            // 2: boundaries fo shift on Y axis
            const xBoundary = [
                Math.max(minX, x - halfDistX),
                Math.min(maxX, x + halfDistX)
            ];
            const yBoundary = [
                Math.max(minY, y - halfDistY),
                Math.min(maxY, y + halfDistY)
            ];

            // genreate random shift on X and Y axis
            const shiftX = (xBoundary[0] + Math.random()*(xBoundary[1] - xBoundary[0])) - x;
            const shiftY = (yBoundary[0] + Math.random()*(yBoundary[1] - yBoundary[0])) - y;
            const shift = [shiftX, shiftY];

            GENERATOR.randomShifts.push(shift);
            GENERATOR.points.push(point);
        }
    }
}

/**
 * Apply certain amount of shift to points.
 */
function shiftPointsStep() {

    let shiftedPoints = [];
    const amount = Math.min((1.0 * GENERATOR.currentStep) / GENERATOR.steps, 1.0);

    for (let i = 0; i < GENERATOR.points.length; i++) {
        const point = GENERATOR.points[i];
        const shift = GENERATOR.randomShifts[i];
        
        shiftedPoints.push([
            point[0] + shift[0]*amount,
            point[1] + shift[1]*amount
        ]);
    }

    GENERATOR.currentStep = Math.min(GENERATOR.currentStep + 1, GENERATOR.steps+1);

    return shiftedPoints;
}

function hasNextStep() {
    return GENERATOR.currentStep <= GENERATOR.steps;
}

