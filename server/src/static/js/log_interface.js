var EDITION_GRID_HEIGHT = 300;
var EDITION_GRID_WIDTH = 300;
var MAX_CELL_SIZE = 100;
var LOG_LIST = [];
var actions;
var currentAction = 0;

var defaultGridData = new Array();
for (var i = 0; i < defaultGridData.length; i++) {
    defaultGridData.push(new Array(3))
    for (var j = 0; j < defaultGridData.length; j++) {
        defaultGridData[i].push(0);
    }
}
var defaultGrid = new Grid(3,3);

function next() {
    currentAction = Math.min(currentAction+1, actions.length-1);
    getGrid();
}

function prev() {
    currentAction = Math.max(0, currentAction-1);
    getGrid();
}

function getGrid() {
    gridData = actions[currentAction]['grid'];
    act = actions[currentAction]['action'];
    tool = act['tool'];
    symbol = act['symbol'];
    row = act['row'];
    col = act['col'];
    height: act['height'];
    width: act['width'];
    selected = act['selected_cells'];
    rowChange = act['row_change'];
    colChange = act['col_change'];
    currentGrid = convertSerializedGridToGridObject(gridData);
    console.log(currentGrid)

    fillJqGridWithData($('#main_grid'), currentGrid);
    fillJqGridWithData($('#clicked'), currentGrid);
    fillJqGridWithData($('#selected'), currentGrid);
    fitCellsToContainer($('#main_grid'), currentGrid.height, currentGrid.width, 400, 400);
    fitCellsToContainer($('#clicked'), currentGrid.height, currentGrid.width, 200, 200);
    fitCellsToContainer($('#selected'), currentGrid.height, currentGrid.width, 200, 200);

    var description = ""
    description += `tool: ${tool}\n`;
    if (symbol) {
        description += `symbol: ${symbol}\n`;
    }
    if (row) {
        description += `row: ${row}\n`;
    }
    if (col) {
        description += `col: ${col}\n`;
    }
    if (height) {
        description += `height: ${height}\n`;
    }
    if (width) {
        description += `width: ${width}\n`;
    }
    if (rowChange) {
        description += `row_change: ${rowChange}\n`;
    }
    if (colChange) {
        description += `col_change: ${colChange}\n`;
    }

    document.getElementById('action_description').innerHTML = description
}

function loadLog(task, user) {
    currentAction = 0;
    selected = LOG_LIST.filter(log => log[0] == task && log[1] == user);
    if (!selected.length) {
        return;
    }
    currentLog = JSON.parse(selected[0][2]);
    actions = currentLog['action_sequence'];
    getGrid();
}

$(window).load(function () {
    // $('#start_page').modal('show');
    $.getJSON(
        "/log_db"
    ).done(function (data) {
        var LOGS = data;
        console.log(LOGS)
        LOGS.forEach(function(log) {
            log_item = $(`<a onclick='loadLog("${log['task_id']}", "${log['user_id']}")'>${log['task_id']}_${log['user_id']}</a>`);
            log_item.appendTo($('#menu'));
            LOG_LIST.push([log['task_id'], log['user_id'], log['action_sequence']]);
        })
    })
})

$(document).ready(function () {
    $('body').keydown(function (event) {
        if (event.which == 37) {
            prev();
        }
        if (event.which == 39) {
            next();
        }
    })
})