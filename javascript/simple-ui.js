const MAZE_URL = 'http://mazemasterjs.com/api/maze';
// const GAME_URL = 'http://localhost:8081/game';
const GAME_URL = 'http://mazemasterjs.com/game';
const TEAM_URL = 'http://mazemasterjs.com/api/team';
const TROPHY_URL = 'http://mazemasterjs.com/api/trophy';

let PLAYBACK_SPEED = 100; // ms between action rendering steps

let ALL_TEAMS;
let ALL_MAZE_STUBS;
let ALL_GAME_STUBS;
let ALL_TROPHIES;

const curLoc = {row: 0, col: 0};
const prevLoc = {row: 0, col: 0};

let resetScore = false;
let curMaze;
let curGame;
let curActNum = 0;
let replayTimer = -1;
let totalScore = 1000;
let curTrophies = [];
let moveCount = 0;

const USER_CREDS = Cookies.get('userCreds');

async function loadData() {
    ALL_MAZE_STUBS = await doAjax(MAZE_URL + '/get');
    console.log(ALL_MAZE_STUBS.length + ' maze stubs loaded.');

    ALL_TEAMS = await doAjax(TEAM_URL + '/get');
    console.log(ALL_TEAMS.length + ' teams loaded.');

    ALL_GAME_STUBS = await doAjax(GAME_URL + '/get');
    console.log(ALL_GAME_STUBS.length + ' game stubs loaded.');

    ALL_TROPHIES = await doAjax(TROPHY_URL + '/get');
    console.log(ALL_TROPHIES.length + ' trophies loaded.');
}

function movePlayer(newRow, newCol) {
    // store previous location
    prevLoc.row = curLoc.row;
    prevLoc.col = curLoc.col;

    // set new location
    curLoc.row = newRow;
    curLoc.col = newCol;

    // grab the right cell elements
    const prevLocDiv = $('#' + prevLoc.row + '-' + prevLoc.col);
    const curLocDiv = $('#' + curLoc.row + '-' + curLoc.col);

    const prevCell = curMaze.cells[prevLoc.row][prevLoc.col];
    const curCell = curMaze.cells[curLoc.row][curLoc.col];

    // clean up the previous (now empty) cell
    styleCellDiv(prevCell, prevLocDiv, curLoc);

    // update the newly, rat-filled cell
    styleCellDiv(curCell, curLocDiv, curLoc);

    // // remark the path if player stepped on it
    // if (!!(curCell.tags & CELL_TAGS.PATH) || !!(prevCell.tags & CELL_TAGS.PATH)) {
    //     console.log('Player marred the path, redrawing..');
    //     markPath(curMaze, curMaze.cells[curMaze.startCell.row][curMaze.startCell.col], DIRS.NONE);
    // }
}

async function loadGame(gameId) {
    curActNum = 0;
    curTrophies = [];
    $('#totalScore').text(totalScore);
    $('#moveCount').text(moveCount);
    $('#actionOutcomes').empty();
    $('#gameTrophies').empty();

    clearInterval(replayTimer);
    replayTimer = null;

    console.log('Loading game.id #' + gameId);
    curGame = await doAjax(GAME_URL + '/getFull/' + gameId);
    console.log('Game loaded.');

    console.log('Loading maze #' + curGame.game.maze.id);
    await loadMaze(curGame.game.maze.id).then();

    if (resetScore) {
        resetScore = false;
        totalScore = 1000;
        moveCount = 0;
    }
}

function startReplay() {
    PLAYBACK_SPEED = 100 - curMaze.challenge * 5;
    console.log('PLAYBACK_SPEED is ' + PLAYBACK_SPEED);
    replayTimer = setInterval(nextAct, PLAYBACK_SPEED);
}

function stopReplay() {
    clearInterval(replayTimer);
    replayTimer = null;
}

function nextAct() {
    console.log('nextAct()', 'curActNum ->' + curActNum, 'nextAct ->' + curActNum + 1, 'actCount ->', curGame.game.actions.length);
    curActNum++;
    if (curGame.game.actions.length > curActNum) {
        act = curGame.game.actions[curActNum];
        console.log('Action:', act);

        let pPos = JSON.parse(act.outcomes[act.outcomes.length - 1]);

        movePlayer(pPos.row, pPos.col);

        if (act.command == COMMANDS.WRITE) {
            const cellId = pPos.row + '-' + pPos.col;
            cDiv = $('#' + cellId);
            if (!cDiv.hasClass('material-icons')) cDiv.addClass('material-icons');
            cDiv.text('message');
        }

        totalScore = totalScore + act.score;
        $('#totalScore').text(totalScore);

        moveCount = moveCount + act.moveCount;
        $('#moveCount').text(moveCount);
        renderCohesion(act.botCohesion);
        renderTrophies(act.trophies);
        renderOutcomes(act.outcomes);
    } else {
        if (null != replayTimer) {
            clearInterval(replayTimer);
            replayTimer = null;

            // load the next game! (if it's the same team - compare first 10 characters of name)
            if (
                $('#selGame > option:selected')
                    .text()
                    .substr(0, 10) ==
                $('#selGame > option:selected')
                    .next('option')
                    .text()
                    .substr(0, 10)
            ) {
                $('#selGame > option:selected')
                    .removeAttr('selected')
                    .next('option')
                    .attr('selected', 'selected');
                Game($('#selGame option:selected').val());
                var theInterval = setInterval(function() {
                    clearInterval(theInterval);
                    startReplay();
                }, 1000);
            } else {
                resetScore = true;
            }
        }
    }
}

function prevAct() {
    if (curActNum > 0) {
        act = curGame.game.actions[curActNum];
        console.log('Action:', act);
        let pPos = JSON.parse(act.outcomes[act.outcomes.length - 1]);
        movePlayer(pPos.row, pPos.col, 1);

        totalScore = totalScore - act.score;
        $('#totalScore').text(totalScore);

        moveCount = moveCount - act.moveCount;
        $('#moveCount').text(moveCount);

        renderOutcomes(act.outcomes);
        curActNum--;
    }
}

function renderCohesion(cScores) {
    let cMsg = '';
    for (let x = 0; x < cScores.length; x++) {
        if (cScores[x] !== null) {
            let bClass = 'botRed';
            if (cScores[x] == 1) {
                bClass = 'botGreen';
            } else if (cScores[x] == 0.5) {
                bClass = 'botYellow';
            }

            cMsg = cMsg + `<span class='botScore ${bClass}'>B${x + 1}</span>`;
        }
    }

    $('#botCohesion').html(cMsg);
}

function renderTrophies(trophies) {
    for (let x = 0; x < trophies.length; x++) {
        const tIndex = curTrophies.findIndex((t) => {
            return t.id == trophies[x].id;
        });

        if (tIndex == -1) {
            const fTrophy = ALL_TROPHIES.find((fT) => {
                return fT.id == trophies[x].id;
            });

            curTrophies.push({id: trophies[x].id, name: fTrophy.name, count: 1});
        } else {
            curTrophies[tIndex].count++;
        }
    }

    let tMsg = '';
    for (let x = 0; x < curTrophies.length; x++) {
        tMsg = tMsg + `<p>${curTrophies[x].name}&nbsp;(<span class='trophyCount'>&nbsp;x${curTrophies[x].count}</span>&nbsp;)</p>`;
    }
    $('#gameTrophies').html(tMsg);
}

function renderOutcomes(outcomes) {
    let ocMsgs = '';
    for (let x = 0; x < outcomes.length - 1; x++) {
        ocMsgs = ocMsgs + `<p>${outcomes[x]}</p>`;
    }
    $('#actionOutcomes').html(ocMsgs);
}

/**
 * Load games into selection list
 */
function loadGameSelect() {
    console.log('Loading active games list...');
    let opts = [];

    ALL_GAME_STUBS.forEach((game) => {
        const team = ALL_TEAMS.find((t) => {
            return t.id == game.teamId;
        });

        const maze = ALL_MAZE_STUBS.find((m) => {
            return m.id == game.mazeStub.id;
        });

        if (game.botId == '') {
            opts.push(`<option value='${game.gameId}'>${team.name} in ${maze.name}</option>`);
        }
    });

    $('#selGame').html(opts);
}

/**
 * Load all maze stub data from the maze-service
 *
 * @param {*} mazeId
 */
function loadMazeSelect() {
    console.log('Loading maze list...');

    doAjax(MAZE_URL + '/get').then((mazes) => {
        for (const maze of mazes) {
            let opt = "<option value='" + maze.id + "'>";
            opt += maze.name + ' (' + maze.height + ' x ' + maze.width + ')';
            opt += '</option>';
            $('#selMaze').append(opt);
        }
    });
}

/**
 * Load the requested maze from the maze-service
 *
 * @param {*} mazeId
 */
async function loadMaze(mazeId) {
    console.log('Loading maze ' + mazeId);
    $('#loadingScreen').toggle();

    doAjax(MAZE_URL + '/get?id=' + mazeId).then((data) => {
        // set the maze global
        curMaze = data[0];

        $(':root').css('--rows', curMaze.cells.length);
        $(':root').css('--cols', curMaze.cells[0].length);

        // set player location to start cell
        curLoc.row = curMaze.startCell.row;
        curLoc.col = curMaze.startCell.col;

        // render the maze
        renderMaze(curMaze);

        // hide the loading screen
        $('#loadingScreen').toggle();
    });
}

/**
 * Returns the opposite direction
 *
 * @param {*} dir
 */
function reverseDir(dir) {
    switch (dir) {
        case DIRS.NORTH: {
            return DIRS.SOUTH;
        }
        case DIRS.SOUTH: {
            return DIRS.NORTH;
        }
        case DIRS.EAST: {
            return DIRS.WEST;
        }
        case DIRS.WEST: {
            return DIRS.EAST;
        }
        default: {
            return DIRS.NONE;
        }
    }
}

/**
 * Fetches and returns content from the provided url using the
 * provided user auth token (btoa)
 *
 * @param {string} url The content url to request content from
 * @param {string} method Optional (default 'GET'), HTTP method to use
 * @param {string} data Optional, POJO Data to upload to the given url
 */
async function doAjax(url, method = 'GET', data = {}) {
    return $.ajax({
        url,
        data,
        dataType: 'json',
        method: method,
        contentType: 'application/json',
        headers: {Authorization: 'Basic ' + 'S3JlZWJvZzpKRGVhbg=='}
    })
        .then((data) => {
            switch (method) {
                case 'PUT':
                case 'DELETE': {
                    return Promise.resolve(true);
                }
                default: {
                    return Promise.resolve(data);
                }
            }
        })
        .catch((ajaxError) => {
            return Promise.reject(ajaxError);
        });
}
