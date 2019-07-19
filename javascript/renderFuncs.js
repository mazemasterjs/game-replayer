const TROPHY_IDS = {
    CHEDDAR_DINNER: 0,
    DAZED_AND_CONFUSED: 1,
    DOUBLE_BACKER: 2,
    FLAWLESS_VICTORY: 3,
    JUMPING_JACK_FLASH: 4,
    KICKING_UP_DUST: 5,
    LIGHT_AT_THE_END: 6,
    LOOPER: 7,
    MIGHTY_MOUSE: 8,
    NERVOUS_WALK: 9,
    OUT_OF_MOVES: 10,
    PAPERBACK_WRITER: 11,
    SCRIBBLER: 12,
    SHORTCUTTER: 13,
    SPINNING_YOUR_WHEELS: 14,
    TAKING_A_STAND: 15,
    STANDING_AROUND: 16,
    THE_LONGER_WAY_HOME: 17,
    THE_LONGEST_WAY_HOME: 18,
    THE_LONG_WAY_HOME: 19,
    TOO_HOT_TO_HANDLE: 20,
    WASTED_TIME: 21,
    WATCHING_PAINT_DRY: 22,
    WISHFUL_DYING: 23,
    WISHFUL_THINKING: 24,
    YOU_FELL_FOR_IT: 25,
    YOU_FOUGHT_THE_WALL: 26,
    KITTY_HAS_CLAWS: 27,
    ONE_HUNDRED_SNEAK: 28,
    THE_WAITING_GAME: 28,
    THE_INEVITABLE: 29,
    WHERE_AM_I: 30,
    STOP_RIGHT_THERE: 31,
    THE_PITS: 32,
    TOO_GOOD_TO_BE_TRUE: 33
};

const PLAYER_STATES = {
    NONE: 0,
    STANDING: 1,
    SITTING: 2,
    LYING: 4,
    STUNNED: 8,
    BLIND: 16,
    BURNING: 32,
    LAMED: 64,
    BEARTRAPPED: 128,
    SLOWED: 256,
    DEAD: 512,
    POISONED: 1024
};

const DIRS = {
    NONE: 0,
    NORTH: 1,
    SOUTH: 2,
    EAST: 4,
    WEST: 8,
    LEFT: 16,
    RIGHT: 32
};

const CELL_TAGS = {
    NONE: 0,
    START: 1,
    FINISH: 2,
    PATH: 4,
    CARVED: 8,
    LAVA: 16
};

const CELL_TRAPS = {
    NONE: 0,
    PIT: 1,
    MOUSETRAP: 2,
    TARPIT: 4,
    FLAMETHOWER: 8,
    POISON_DART: 16,
    TELEPORTER: 32,
    DEADFALL: 64,
    FRAGILE_FLOOR: 128,
    CHEESE: 256
};

const COMMANDS = {
    NONE: 0,
    FACE: 1,
    SIT: 4,
    STAND: 6,
    TURN: 7,
    MOVE: 8,
    JUMP: 9,
    WAIT: 10,
    WRITE: 11,
    SNEAK: 13
};

const GAME_RESULTS = {
    NONE: 0,
    IN_PROGRESS: 1,
    OUT_OF_MOVES: 2,
    OUT_OF_TIME: 3,
    DEATH_TRAP: 4,
    DEATH_POISON: 5,
    DEATH_LAVA: 6,
    WIN: 7,
    WIN_FLAWLESS: 8,
    ABANDONED: 9
};

const GAME_STATES = {
    NEW: 0,
    IN_PROGRESS: 1,
    FINISHED: 2,
    ABORTED: 3,
    ERROR: 4
};

const GAME_MODES = {
    NONE: 0,
    SINGLE_PLAYER: 1,
    MULTI_PLAYER: 2
};

const USER_ROLES = {
    NONE: 0,
    USER: 1,
    ASSISTANT: 2,
    INSTRUCTOR: 3,
    ADMIN: 4
};

// some aliasing to shorten common enums
const DIRECTIONS = DIRS;
const CMDS = COMMANDS;

/**
 * Render the given maze into the mazeView css-grid by
 * generating grid-items and appending them to the
 * grid-container.
 *
 * @param {*} maze
 */
function renderMaze(curMaze) {
    const mv = $('#mazeView');
    mv.empty();

    // loop through the cells array to build and style the grid
    for (let row = 0; row < curMaze.cells.length; row++) {
        for (let col = 0; col < curMaze.cells[0].length; col++) {
            const cell = curMaze.cells[row][col];
            const cId = cell.pos.row + '-' + cell.pos.col;
            mv.append("<div id='" + cId + "'></div>");
            styleCellDiv(cell, $('#' + cId), {row: curMaze.startCell.row, col: curMaze.startCell.col});
        }
    }
    // mark the path
    // markPath(curMaze, curMaze.cells[curMaze.startCell.row][curMaze.startCell.col], DIRS.NORTH);

    // and resize the grid (just in case)
    resizeGrid();
}

function styleCellDiv(cell, cDiv, pLoc) {
    if (!cell) {
        console.log('styleCell(cell, cDiv, pLoc) : WARNING - cell is undefined.');
        return;
    }

    // persist message icon
    const hasMsg = cDiv.text().includes('message');

    const row = cell.pos.row;
    const col = cell.pos.col;

    cDiv.remove;

    // set the base classes (clearing any others)
    cDiv.attr('class', 'grid-item cell');

    // set exit classes
    if (!!(cell.exits & DIRS.NORTH) && !(cell.tags & CELL_TAGS.START)) cDiv.addClass('ceNorth');
    if (!!(cell.exits & DIRS.SOUTH) && !(cell.tags & CELL_TAGS.FINISH)) cDiv.addClass('ceSouth');
    if (!!(cell.exits & DIRS.EAST)) cDiv.addClass('ceEast');
    if (!!(cell.exits & DIRS.WEST)) cDiv.addClass('ceWest');

    // thicken outer walls
    if (!(cell.tags & CELL_TAGS.START) && row === 0) cDiv.addClass('cwNorth');
    if (!(cell.tags & CELL_TAGS.FINISH) && row === curMaze.cells.length - 1) cDiv.addClass('cwSouth');
    if (col === 0) cDiv.addClass('cwWest');
    if (col === curMaze.cells[0].length - 1) cDiv.addClass('cwEast');

    // set start cell class
    if (!!(cell.tags & CELL_TAGS.START)) {
        cDiv.addClass('cStart');
        cDiv.addClass('material-icons');
        cDiv.text('arrow_downward');
    }

    // set finish cell class
    if (!!(cell.tags & CELL_TAGS.FINISH)) {
        cDiv.addClass('cFinish');
        cDiv.addClass('material-icons');
        cDiv.text('arrow_downward');
    }

    if (cell.traps != 0) {
        cDiv.addClass('cTrap');
        cDiv.addClass('material-icons');
        if (!!(cell.traps & CELL_TRAPS.PIT)) cDiv.text('filter_center_focus');
        if (!!(cell.traps & CELL_TRAPS.MOUSETRAP)) cDiv.text('unfold_less');
        if (!!(cell.traps & CELL_TRAPS.TARPIT)) cDiv.text('pool');
        if (!!(cell.traps & CELL_TRAPS.FLAMETHOWER)) cDiv.text('whatshot');
        if (!!(cell.traps & CELL_TRAPS.POISON_DART)) cDiv.text('last_page');
        if (!!(cell.traps & CELL_TRAPS.TELEPORTER)) cDiv.text('not_listed_location');
        if (!!(cell.traps & CELL_TRAPS.DEADFALL)) cDiv.text('pages');
        if (!!(cell.traps & CELL_TRAPS.FRAGILE_FLOOR)) cDiv.text('texture');
        if (!!(cell.traps & CELL_TRAPS.CHEESE)) cDiv.text('restaurant');
    } else {
        if (!!(cell.tags & CELL_TAGS.PATH) && !(cell.tags & CELL_TAGS.START) && !(cell.tags & CELL_TAGS.FINISH)) {
            cDiv.addClass('cPath');
            cDiv.addClass('material-icons');
            cDiv.text('star_border');
        }
    }

    // persist player message icon
    if (hasMsg) {
        if (!cDiv.hasClass('material-icons')) cDiv.addClass('material-icons');
        cDiv.removeClass('cPath');
        cDiv.text('message');
    }

    // clear any other classes and set player
    if (row === pLoc.row && col === pLoc.col) {
        // console.log('pLoc: ' + pLoc.row + ', ' + pLoc.col);
        cDiv.removeClass('cPath material-icons');
        cDiv.addClass('player');
        cDiv.text('');
    }
}

/**
 * Dynamically resizes the mazeView css-grid based on the
 * dimentions of the maze being rendered.
 */
function resizeGrid() {
    const mv = $('#mazeView');
    console.log('Resize to mazeView to ' + mv.css('width') + 'x' + mv.css('height'));
    const rowCount = parseInt($(':root').css('--rows'));
    const colCount = parseInt($(':root').css('--cols'));
    const width = parseFloat(mv.css('width')) / colCount;
    const height = parseFloat(mv.css('height')) / rowCount;
    const newSize = width < height ? width.toString() + 'px ' : height.toString() + 'px ';

    // console.log('MV Height: ' + mv.css('height'));
    // console.log('MV Width: ' + mv.css('width'));
    // console.log('GI Height: ' + height);
    // console.log('GI Width: ' + width);
    // console.log('View Size: ' + newSize);

    // push new cell / grid sizes
    mv.css('grid-template-rows', newSize.repeat(rowCount));
    mv.css('grid-template-columns', newSize.repeat(colCount));

    // set the new cell-icon font size
    $(':root').css('--cellPathFontSize', height / 3 + 'px');
    $(':root').css('--cellIconFontSize', height / 1.5 + 'px');
    // console.log('Icon Size: ' + $(':root').css('--cellIconFontSize'));

    // calculate and set wall and edge widths based on maze size
    $(':root').css('--wallWidth', Math.ceil(10 / colCount) + 'px');
    $(':root').css('--edgeWidth', Math.ceil(10 / colCount) * 2 + 'px');
    // console.log('Wall Width: ' + $(':root').css('--wallWidth'));
    // console.log('Edge Width: ' + $(':root').css('--edgeWidth'));

    $('#actionLog').css('visibility', 'visible');
    $('#actionLog').position({
        my: 'left top',
        at: 'right+10 top',
        of: '#mazeView',
        collision: 'fit'
    });
}

function markPath(maze, cell, fromDir) {
    const rows = maze.cells.length - 1;
    const cols = maze.cells[0].length - 1;
    const cPos = cell.pos;
    let cNext;
    let toIcon;
    let fromIcon;

    // follow the path all the way tot he finish
    if (!!(cell.tags & CELL_TAGS.FINISH)) {
        console.log('markPath() -> End of path reached.');
        return;
    }

    // console.log('Entered markPath() -> cPos: ' + cPos.row, cPos.col);
    for (var dirName in DIRS) {
        let pathFound = false;
        const dir = DIRS[dirName];
        if (dir > 0 && dir !== fromDir && !!(cell.exits & dir)) {
            // console.log('markPath() -> Checking for path in dir ' + dir);

            switch (dir) {
                case DIRS.NORTH: {
                    // don't continue of we're at the top of the maze
                    if (cPos.row > 0) {
                        // console.log('HIT ' + dirName);
                        cNext = maze.cells[cPos.row - 1][cPos.col];
                        if (!!(cNext.tags & CELL_TAGS.PATH)) {
                            toIcon = 'expand_less';
                            fromIcon = 'expand_more';
                            fromDir = DIRS.SOUTH;
                            pathFound = true;
                        }
                    }
                    break;
                }
                case DIRS.SOUTH: {
                    // don't continue of we're at the bottom of the maze
                    if (cPos.row < rows) {
                        // console.log('HIT ' + dirName);
                        cNext = maze.cells[cPos.row + 1][cPos.col];
                        if (!!(cNext.tags & CELL_TAGS.PATH)) {
                            toIcon = 'expand_more';
                            fromIcon = 'expand_less';
                            fromDir = DIRS.NORTH;
                            pathFound = true;
                        }
                    }
                    break;
                }
                case DIRS.EAST: {
                    // don't continue of we're at the right edge of the maze
                    if (cPos.col < cols) {
                        // console.log('HIT ' + dirName);
                        cNext = maze.cells[cPos.row][cPos.col + 1];
                        if (!!(cNext.tags & CELL_TAGS.PATH)) {
                            toIcon = 'chevron_right';
                            fromIcon = 'chevron_left';
                            fromDir = DIRS.WEST;
                            pathFound = true;
                        }
                    }
                    break;
                }
                case DIRS.WEST: {
                    // don't continue of we're at the left edge of the maze
                    if (cPos.col > 0) {
                        // console.log('HIT ' + dirName);
                        cNext = maze.cells[cPos.row][cPos.col - 1];
                        if (!!(cNext.tags & CELL_TAGS.PATH)) {
                            toIcon = 'chevron_left';
                            fromIcon = 'chevron_right';
                            fromDir = DIRS.EAST;
                            pathFound = true;
                        }
                    }
                    break;
                }
                default: {
                    console.log('markPath() -> Error: No path direction found.');
                }
            }

            // if we found the path, stop iterating
            if (pathFound) break;
        }
    }

    if (!cNext) {
        console.log('markPath() -> Error: cNext is not set.');
        return;
    }

    let cDiv = $('#' + cell.pos.row + '-' + cell.pos.col);
    let cNextDiv = $('#' + cNext.pos.row + '-' + cNext.pos.col);
    if (cNextDiv.text() !== fromIcon && !(cell.tags & CELL_TAGS.FINISH) && !(cell.tags & CELL_TAGS.START) && !cDiv.hasClass('player')) {
        // console.log('markPath(' + dirName + ') -> TAGGING cPos: ' + cDiv.attr('id'));
        cDiv.addClass('cPath material-icons');
        cDiv.text(toIcon);
    } // else {
    //     console.log('markPath(' + dirName + ') -> NOT TAGGING cPos: ' + cDiv.attr('id'));
    // }

    // follow the path...
    markPath(maze, cNext, fromDir);
}
