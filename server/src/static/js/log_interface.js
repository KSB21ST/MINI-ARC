var EDITION_GRID_HEIGHT = 300;
var EDITION_GRID_WIDTH = 300;
var MAX_CELL_SIZE = 100;
var LOG_LIST = [];
var actions;
var currentAction = 0;
var INPUT_GRID;
var TASKLIST;

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
    height = act['height'];
    width = act['width'];
    selected = act['selected_cells'];
    rowChange = act['row_change'];
    colChange = act['col_change'];
    submit = actions[currentAction]['submit'];
    time = actions[currentAction]['time'];
    currentGrid = convertSerializedGridToGridObject(gridData);
    
    fillJqGridWithData($('#main_grid'), currentGrid);
    fillJqGridWithData($('#input_grid'), INPUT_GRID);
    fillJqGridWithData($('#clicked'), currentGrid);
    fillJqGridWithData($('#selected'), currentGrid);
    fitCellsToContainer($('#main_grid'), currentGrid.height, currentGrid.width, 400, 400);
    fitCellsToContainer($('#input_grid'), INPUT_GRID.height, INPUT_GRID.width, 150, 150);
    fitCellsToContainer($('#clicked'), currentGrid.height, currentGrid.width, 150, 150);
    fitCellsToContainer($('#selected'), currentGrid.height, currentGrid.width, 150, 150);
    
    

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
    if (time) {
        description += `time: ${time}\n`;
    }
    if (submit) {
        description += `submit: ${submit}\n`;
    }

    document.getElementById('action_description').innerHTML = description

    selectedCells = act['selected_cells'];
    copyPasteData = act['copy_paste_data'];
    $('.ui-selected').each((i, cell) => $(cell).removeClass('ui-selected'));
    if (selectedCells) {
        selectedCells.forEach(function(cell) {
            r = cell['row'];
            c = cell['col'];
            $('#selected').find(`[x=${r}][y=${c}]`).addClass('ui-selected');
        })
    }
    if (copyPasteData) {
        copyPasteData.forEach(function(cell) {
            r = cell[0];
            c = cell[1];
            source = cell[3];
            console.log(source)
            if (!source) {
                $('#selected').find(`[x=${r}][y=${c}]`).addClass('ui-selected');
            } else {
                $('#input_grid').find(`[x=${r}][y=${c}]`).addClass('ui-selected');
            }
        })
    }
    if (row && col) {
        $('#clicked').find(`[x=${row}][y=${col}]`).addClass('ui-selected');
    }
}

function loadLog(id, task, user) {
    currentAction = 0;
    selected = LOG_LIST.filter(log => log[0] == id);
    if (!selected.length) {
        return;
    }
    matching_task = TASKLIST.filter(t => t['task_name'] == task);
    if (matching_task.length) {
        content = JSON.parse(matching_task[0]['content']);
        test = content['test']
        input = test[0]['input'];
        INPUT_GRID = convertSerializedGridToGridObject(input);
    }
    print(selected[0][1])
    currentLog = JSON.parse(selected[0][1]);
    actions = currentLog['action_sequence'];
    getGrid();
}

$(window).load(function () {
    $.getJSON(
        "/log_db"
    ).done(function (data) {
        var LOGS = data;
        console.log(LOGS)
        cnt = 0
        LOGS.forEach(function(log) {
            log_item = $(`<a onclick='loadLog("${log['id']}", "${log['task_id']}", "${log['user_id']}")'>trace_${cnt}_${log['user_id']}_${log['user_id']}</a>`);
            log_item.appendTo($('#menu'));
            LOG_LIST.push([log['id'], log['action_sequence']]);
            cnt += 1
        })
        document.getElementById('menu').scrollTop = -document.getElementById('menu').scrollHeight;
    })
    $.getJSON(
        "/tasklist"
    ).done(function (data) {
        TASKLIST = data;
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