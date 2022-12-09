
// Internal state.
var CURRENT_INPUT_GRID = new Grid(5, 5);
var CURRENT_OUTPUT_GRID = new Grid(5, 5);
var TEST_PAIRS = new Array();
var CURRENT_TEST_PAIR_INDEX = 0;
var COPY_PASTE_DATA = new Array();
var SELECTED_DATA = new Array();
var LAYERS = new Array();
LAYERS.push(new Layer(new Array(), 0, 5, 5, 0));
var currentLayerIndex = 0;
var EXAMPLES = new Array();
var currentExample = 0;
var tries = 0;
var logSaved = false;

// Cosmetic.
var EDITION_GRID_HEIGHT = 300;
var EDITION_GRID_WIDTH = 300;
var MAX_CELL_SIZE = 100;

// Logs
var logs = new Log("", "");
var logsWithUndo = new Log("", "");
var redoStates = new Array();

// user id
var user_id = Date.now().toString(36) + Math.random().toString(36).substr(2);

// time
var prevTime = 0
var currTime = 0

// Task List
var TASKLIST = new Array();
var currentTask = "";
var taskIndex = 0;

var keyState = {};
onkeydown = onkeyup = (event) => {
    keyState[event.key] = (event.type == 'keydown');
}

function addLog(action, submit, freezeUpdateUndo) {
    if (!submit) {
        submit = 0;
    }
    currTime = new Date()
    var time = currTime - prevTime
    prevTime = currTime
    // makeGridFromLayer();
    var gridCopy = [];
    for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
        gridCopy[i] = CURRENT_OUTPUT_GRID.grid[i].slice();
    }
    var layerCopy = [];
    LAYERS.forEach(function (layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        layerCopy.push(new Layer(jsonLayer.cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    logs.addAction(
        action,
        gridCopy,
        currentLayerIndex,
        layerCopy,
        time,
        submit
    );
    if (!freezeUpdateUndo) {
        redoStates = [];
        logsWithUndo.addAction(
            action,
            gridCopy,
            currentLayerIndex,
            layerCopy,
            time,
            submit
        );
    }
}

function resetTask() {
    prevTime = new Date()
    tries = 0;
    logSaved = false;
    CURRENT_INPUT_GRID = new Grid(5, 5);
    TEST_PAIRS = new Array();
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#task_preview').html('');
    resetOutputGrid();
    EXAMPLES = [];
    LAYERS = new Array();
    LAYERS.push(new Layer(new Array(), 0, 5, 5, 0));
    currentLayerIndex = 0;
    currentExample = 0;

    addLog({tool: 'start'});
}

function repeatTask() {
    loadTaskFromDb(currentTask);
    closeContinue();
}

function newTask() {
    randomTask();
    closeContinue();
}

function refreshEditionGrid(jqGrid, dataGrid, pad) {
    fillJqGridWithData(jqGrid, dataGrid, pad);
    setUpEditionGridListeners(jqGrid);
    fitCellsToContainer(jqGrid, dataGrid.height, dataGrid.width, EDITION_GRID_HEIGHT, EDITION_GRID_HEIGHT);
    initializeSelectable();
}

function syncFromEditionGridToDataGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

function syncFromDataGridToEditionGrid(pad) {
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID, pad);
}

function getSelectedSymbol() {
    selected = $('#symbol_picker .selected-symbol-preview')[0];
    return $(selected).attr('symbol');
}

function setUpEditionGridListeners(jqGrid) {
    jqGrid.find('.cell').click(function (event) {
        cell = $(event.target);
        symbol = getSelectedSymbol();

        mode = $('input[name=tool_switching]:checked').val();
        if (mode == 'floodfill') {
            // If floodfill: fill all connected cells.
            prevGrid = new Grid(CURRENT_OUTPUT_GRID.height, CURRENT_OUTPUT_GRID.width);
            for (var i = 0; i < CURRENT_OUTPUT_GRID.height; i++) {
                for (var j = 0; j < CURRENT_OUTPUT_GRID.width; j++) {
                    prevGrid.grid[i][j] = CURRENT_OUTPUT_GRID.grid[i][j];
                }
            }
            syncFromEditionGridToDataGrid();
            grid = CURRENT_OUTPUT_GRID.grid;
            affectedCells = floodfillFromLocation(grid, cell.attr('x'), cell.attr('y'), symbol);
            for (var i = 0; i < affectedCells.length; i++) {
                LAYERS[currentLayerIndex].addCell(affectedCells[i]);
            }
            syncFromDataGridToEditionGrid();
            addLog({ tool: 'floodfill', symbol: symbol, row: cell.attr('x'), col: cell.attr('y'), selected_cells: [...new Set(affectedCells)] });
        }
        else if (mode == 'edit') {
            // Else: fill just this cell.
            setCellSymbol(cell, symbol);
            LAYERS[currentLayerIndex].addCell(new Cell(cell.attr('x'), cell.attr('y'), cell.attr('symbol')))
            syncFromEditionGridToDataGrid();
            addLog({ tool: 'edit', symbol: symbol, row: cell.attr('x'), col: cell.attr('y') });
        }
        updateLayer(currentLayerIndex);
    });
}

function resizeOutputGrid() {
    size = $('#output_grid_size').val();
    size = parseSizeTuple(size);
    height = size[0];
    width = size[1];

    jqGrid = $('#output_grid .edition_grid');
    syncFromEditionGridToDataGrid();
    dataGrid = JSON.parse(JSON.stringify(CURRENT_OUTPUT_GRID.grid));
    CURRENT_OUTPUT_GRID = new Grid(height, width, dataGrid);
    refreshEditionGrid(jqGrid, CURRENT_OUTPUT_GRID, true);

    for (var i = 0; i < LAYERS.length; i++) {
        LAYERS[i].height = CURRENT_OUTPUT_GRID.height;
        LAYERS[i].width = CURRENT_OUTPUT_GRID.width;
    }
    updateAllLayers();
    initLayerPreview();
    addLog({ tool: 'resizeOutputGrid', height: height, width: width });
}

function resetOutputGrid() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = new Grid(5, 5);
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val("5x5");
    resizeOutputGrid();
    LAYERS[currentLayerIndex].height = CURRENT_OUTPUT_GRID.height;
    LAYERS[currentLayerIndex].width = CURRENT_OUTPUT_GRID.width;
    LAYERS[currentLayerIndex].cells = [];
    updateAllLayers();
    initLayerPreview();
    addLog({ tool: 'resetOutputGrid' });
}

function copyFromInput() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid(true);
    currLayer = LAYERS[currentLayerIndex];
    currLayer.updateGrid(CURRENT_OUTPUT_GRID);
    for (var i = 0; i < LAYERS.length; i++) {
        LAYERS[i].height = CURRENT_OUTPUT_GRID.height;
        LAYERS[i].width = CURRENT_OUTPUT_GRID.width;
    }
    initLayerPreview();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
    addLog({ tool: 'copyFromInput' });
}

function fillPairPreview(id, inputGrid, outputGrid) {
    var pairSlot = $('#pair_preview_' + id);
    var inputSlot = pairSlot.find('.input_pair');
    var outputSlot = pairSlot.find('.output_pair');
    if (!pairSlot.length) {
        // Create HTML for pair.
        pairSlot = $('<div id="pair_preview_' + id + '" class="pair_preview" index="' + id + '"></div>');
        var inputSlot = $('<div class="input_pair"></div>');
        var arrow = $('<div id="demo_arrow" class="arrow"><h1>&#8594;</h1></div>');
        var outputSlot = $('<div class="output_pair"></div>');
        inputSlot.appendTo(pairSlot);
        arrow.appendTo(pairSlot);
        outputSlot.appendTo(pairSlot);
        pairSlot.appendTo('#task_preview');
    }
    var jqInputGrid = inputSlot.find('.input_preview');
    if (!jqInputGrid.length) {
        jqInputGrid = $('<div class="input_preview"></div>');
        jqInputGrid.appendTo(inputSlot);
    }

    var jqOutputGrid = outputSlot.find('.output_preview');
    if (!jqOutputGrid.length) {
        jqOutputGrid = $('<div class="output_preview"></div>');
        jqOutputGrid.appendTo(outputSlot);
    }


    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 175, 175);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, outputGrid.height, outputGrid.width, 175, 175);
}

function fillLayerPreview(layerId) {
    var layerSlot = $('#layer_' + layerId);
    if (!layerSlot.length) {
        layerSlot = $('<div id ="layer_' + layerId + '" class="layer_preview" value="' + layerId + '"><input type="radio" class="layer_button" name="layer" id="' + layerId + '" value="' + layerId + '" checked><label for="' + layerId + '" class="layer_selector"></label><div class="grid_preview"></div></div>');
        layerSlot.appendTo('#layer_panel');
        $(`input[type=radio][id=${layerId}]`).click(function () {
            initializeSelectable();
            initializeLayerChange();
        })
    }

    var jqInputGrid = layerSlot.find('.grid_preview');

    layerGrid = LAYERS[layerId].getGrid();
    fillJqGridWithData(jqInputGrid, layerGrid, false);
    fitCellsToContainer(jqInputGrid, layerGrid.height, layerGrid.width, 75, 75);
}

function initLayerPreview() {
    $('.layer_preview').remove();
    for (var id = 0; id < LAYERS.length; id++) {
        fillLayerPreview(id);
    }
}

function loadJSONTask(train, test) {
    resetTask();
    $('#modal_bg').hide();
    $('#error_display').hide();
    $('#info_display').hide();

    for (var i = 0; i < train.length; i++) {
        pair = train[i];
        values = pair['input'];
        input_grid = convertSerializedGridToGridObject(values)
        values = pair['output'];
        output_grid = convertSerializedGridToGridObject(values)
        // EXAMPLES.push([input_grid, output_grid]);
        fillPairPreview(i, input_grid, output_grid);
    }
    $('#current_example_id').html('1');
    $('#total_examples').html(EXAMPLES.length);
    for (var i = 0; i < test.length; i++) {
        pair = test[i];
        TEST_PAIRS.push(pair);
    }
    values = TEST_PAIRS[0]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#current_test_input_id_display').html('1');
    $('#total_test_input_count_display').html(test.length);
}

function display_task_name(task_name, task_index, number_of_tasks) {
    big_space = '&nbsp;'.repeat(4);
    document.getElementById('task_name').innerHTML = (
        'Task name:' + big_space + task_name + big_space
        // + (
        //     task_index===null ? '' :
        //     ( String(task_index) + ' out of ' + String(number_of_tasks) )
        // )
    );
}

function loadTaskFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        errorMsg('No file selected');
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;

        try {
            contents = JSON.parse(contents);
            train = contents['train'];
            test = contents['test'];
        } catch (e) {
            errorMsg('Bad file format');
            return;
        }
        loadJSONTask(train, test);

        $('#load_task_file_input')[0].value = "";
        display_task_name(file.name, null, null);
        logs = new Log(file.name, user_id);
        logsWithUndo = new Log(file.name, user_id);
        addLog({tool : 'start'});
    };
    reader.readAsText(file);
}

function loadTaskFromDb(task_name) {
    currentTask = task_name;
    matching_task = TASKLIST.filter(task => task['task_name'] == task_name);
    if (!matching_task.length) {
        return;
    }
    content = JSON.parse(matching_task[0]['content']);
    loadJSONTask(content['train'], content['test']);
    $('#load_task_file_input')[0].value = "";
    display_task_name(task_name, null, null);
    logs = new Log(task_name, user_id);
    logsWithUndo = new Log(task_name, user_id);
    addLog({tool : 'start'});
    copyFromInput();
}

function start_test() {
    username_txt = $('#user_name').val()
    if (!username_txt) {
        return;
    }
    user_id += "_" + username_txt;
    randomTask();
}

function start_create() {
    username_txt = $('#user_name').val()
    if (!username_txt) {
        return;
    }
    user_id += "_" + username_txt;
    history.pushState(null, null, 'testset')
    window.location.reload();
}

function start_logs() {
    username_txt = $('#user_name').val()
    if (!username_txt) {
        return;
    }
    user_id += "_" + username_txt;
    history.pushState(null, null, 'logs')
    window.location.reload();
}

function randomTask() {
    resetTask();
    var subset = "MiniARC";
    task_subset = TASKLIST.filter(t => t['type'] == subset);
    var task_index = Math.floor(Math.random() * task_subset.length);
    var task = task_subset[task_index];
    //added this part for Happy ARC Day2
    // task = TASKLIST.find(t => t['task_name'].includes('Felipe_Centralize_l6aei788udv3m'));
    //
    task = TASKLIST[taskIndex]
    var json = JSON.parse(task['content']);
    loadJSONTask(json['train'], json['test']);
    infoMsg("Loaded task training/" + task_subset["task_name"]);
    currentTask = task['task_name'];
    display_task_name(task['task_name'], task, task.length);
    logs = new Log(task['task_name'], user_id);
    logsWithUndo = new Log(task['task_name'], user_id);
    addLog({tool : 'start'});
    copyFromInput();
    taskIndex = (taskIndex + 1) % TASKLIST.length
}

function openTaskList() {
    $("#task_side_nav").width("250px");
    $("#task_list").width("250px");
    $("#workspace").css('margin-left', '250px');
}

function closeTaskList() {
    $("#task_side_nav").width("0");
    $("#workspace").css('margin-left', '0');
}

function prevTestInput() {
    if (CURRENT_TEST_PAIR_INDEX <= 0) {
        return
    }
    CURRENT_TEST_PAIR_INDEX -= 1;
    values = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);
    $('#current_test_input_id_display').html(CURRENT_TEST_PAIR_INDEX + 1);
    $('#total_test_input_count_display').html(test.length);
}

function nextTestInput() {
    if (TEST_PAIRS.length <= CURRENT_TEST_PAIR_INDEX + 1) {
        return
    }
    CURRENT_TEST_PAIR_INDEX += 1;
    values = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);
    $('#current_test_input_id_display').html(CURRENT_TEST_PAIR_INDEX + 1);
    $('#total_test_input_count_display').html(test.length);
}

function closeContinue() {
    $('#continue_modal').css("visibility", "hidden");
}

function saveLogs(log_list, correct) {
    if (!log_list) {
        log_list = logs
    }
    if (logSaved) {
        return;
    }
    $.ajax({
        type: 'POST',
        url: window.location.href,
        data: log_list.getString(),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8'
    }).done(function (msg) {
        
    });
    logSaved = true;
    if (correct) {
        $('#task_result').text("Correct!")
    } else {
        $('#task_result').text("Incorrect")
    }
    $('#continue_modal').css("visibility", "visible");
}

function submitSolution() {
    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;
    if (reference_output.length != submitted_output.length) {
        errorMsg('Wrong solution.');
        logs.action_sequence[logs.action_sequence.length-1]['submit'] = -1;
        // addLog({ tool: "check", correct: false });
        tries += 1
        if (tries >= 3) {
            saveLogs(logs, false);
        }
        return;
    }
    for (var i = 0; i < reference_output.length; i++) {
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++) {
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg('Wrong solution.');
                logs.action_sequence[logs.action_sequence.length-1]['submit'] = -1;
                // addLog({ tool: "check", correct: false });
                tries += 1
                if (tries >= 3) {
                    saveLogs(logs, false);
                }
                return;
            }
        }

    }
    logs.action_sequence[logs.action_sequence.length-1]['submit'] = 1;
    // addLog({ tool: "check", correct: true });
    saveLogs(logs, true);
    infoMsg('Correct solution!');
}

function fillTestInput(inputGrid) {
    jqInputGrid = $('#evaluation_input #input_test');
    fillJqGridWithData(jqInputGrid, inputGrid, false);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
    initializeSelectable();
}

function copyToOutput() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}

function initializeSelectable() {
    try {
        $('.selectable_grid').selectable('destroy');
        $('.ui-selected').each((i, cell) => $(cell).removeClass('ui-selected'));
    }
    catch (e) {
    }
    toolMode = $('input[name=tool_switching]:checked').val();
    if (toolMode == 'select') {
        infoMsg('Select some cells and click on a color to fill in, or press C to copy');
        $('.selectable_grid').selectable(
            {
                autoRefresh: false,
                filter: '> .row > .cell',
                selected: function (event, ui) {
                    LAYERS[currentLayerIndex].cells.forEach(function (cell) {
                        // console.log(cell);
                        cell.unselect();
                    })
                    $('.ui-selected').each(function (i, selected) {
                        row = $(selected).attr('x');
                        col = $(selected).attr('y');
                        LAYERS[currentLayerIndex].cells.forEach(function (cell) {
                            if (cell.row == row && cell.col == col) {
                                cell.select();
                                // console.log(cell)
                            }
                        })
                    })
                }
            }
        );
    }
}

function initializeLayerChange() {
    currentLayerIndex = $('input[name=layer]:checked').val();
    infoMsg(`layer ${currentLayerIndex} selected`);
    var currLayer = LAYERS[currentLayerIndex];
    currLayer.cells = currLayer.cells.filter(cell => cell.val > 0);

    $('.ui-selected').removeClass('ui-selected');
    initializeSelectable();
    for (var i = 0; i < currLayer.cells.length; i++) {
        var currCell = currLayer.cells[i];
        setCellSymbol($('.edition_grid').find(`[x=${currCell.row}][y=${currCell.col}]`), currCell.val);
        $('.edition_grid').find(`[x=${currCell.row}][y=${currCell.col}]`).addClass('ui-selected');
    }
    syncFromEditionGridToDataGrid();
    addLog({ tool: 'layerChange', new_layer: currentLayerIndex })
}

function updateLayer(id) {
    var layerSlot = $('#layer_' + id);
    var jqInputGrid = layerSlot.find('.grid_preview');
    var layer = LAYERS[id];
    if (layer == undefined) {
        return;
    }
    var layerGrid = layer.getGrid();
    fillJqGridWithData(jqInputGrid, layerGrid, false);
    fitCellsToContainer(jqInputGrid, layerGrid.height, layerGrid.width, 75, 75);
}

function addLayer() {
    selected = $('.ui-selected');
    if (selected.length == 0) {
        return;
    }


    SELECTED_DATA = [];
    for (var i = 0; i < selected.length; i++) {
        r = parseInt($(selected[i]).attr('x'));
        c = parseInt($(selected[i]).attr('y'));
        val = parseInt($(selected[i]).attr('symbol'));
        SELECTED_DATA.push([r, c, val]);
    }

    if (SELECTED_DATA.length == 0) {
        errorMsg('No data selected');
        return;
    }

    selected = $('.edition_grid').find('.ui-selected');
    if (selected.length == 0) {
        targetx = 0;
        targety = 0;
    } else {
        targetx = parseInt(selected.attr('x'));
        targety = parseInt(selected.attr('y'));
    }

    xs = SELECTED_DATA.map((cell) => { return cell[0] });
    ys = SELECTED_DATA.map((cell) => { return cell[1] });
    minx = Math.min(...xs);
    miny = Math.min(...ys);

    SELECTED_DATA = SELECTED_DATA.map((cell) => {
        rs = cell[0] - minx + targetx;
        cs = cell[1] - miny + targety;
        return new Cell(rs, cs, cell[2]);
    });

    var z_val = LAYERS.length
    LAYERS.push(new Layer(SELECTED_DATA, z_val, CURRENT_OUTPUT_GRID.height, CURRENT_OUTPUT_GRID.width, z_val))

    infoMsg(`Data added to Layer ${LAYERS.length}`)
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
}

function deleteLayer() {
    currentLayerIndex = $('input[name=layer]:checked').val();
    if (LAYERS.length <= 1) {
        errorMsg('There must exist at least one layer');
        return;
    }
    if (currentLayerIndex === undefined) {
        return;
    }
    LAYERS.splice(currentLayerIndex, 1);
    infoMsg("delete Layer " + currentLayerIndex);
    updateAllLayers();
    initLayerPreview();
    currentLayerIndex -= 1;
    $("#layer_" + (currentLayerIndex - 1)).prop("checked", true)
    initializeLayerChange();
    makeGridFromLayer();
}

function updateAllLayers() {
    for (var i = 0; i < LAYERS.length; i++) {
        updateLayer(i);
    }
}

function makeGridFromLayer() {
    zSorted = LAYERS.sort(function (l1, l2) { l2.z - l1.z });
    CURRENT_OUTPUT_GRID.height = zSorted[0].height;
    CURRENT_OUTPUT_GRID.width = zSorted[0].width;
    for (var x = 0; x < CURRENT_OUTPUT_GRID.height; x++) {
        for (var y = 0; y < CURRENT_OUTPUT_GRID.width; y++) {
            CURRENT_OUTPUT_GRID.grid[x][y] = 0;
        }
    }
    for (var i = 0; i < zSorted.length; i++) {
        layer = zSorted[i];
        layerGrid = layer.getGrid().grid;
        for (var x = 0; x < CURRENT_OUTPUT_GRID.height; x++) {
            for (var y = 0; y < CURRENT_OUTPUT_GRID.width; y++) {
                if (layerGrid[x][y] > 0) {
                    CURRENT_OUTPUT_GRID.grid[x][y] = layerGrid[x][y];
                }
            }
        }
    }
    syncFromDataGridToEditionGrid();
}

function translateCells(xChange, yChange) {
    var selectedCells = LAYERS[currentLayerIndex].getSelected();
    var selectedCopy = [];
    selectedCells.forEach(function(cell) {
        selectedCopy.push(new Cell(cell.row, cell.col, cell.val, cell.selected));
    })
    selectedCells.forEach(function (cell) {
        cell.setRow(parseInt(cell.row) + yChange);
        cell.setCol(parseInt(cell.col) + xChange);
    })
    $('.ui-selected').removeClass('ui-selected');
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    var validCells = selectedCells.filter(cell => (cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width));
    for (var i = 0; i < validCells.length; i++) {
        $('.edition_grid').find(`[x=${validCells[i].row}][y=${validCells[i].col}]`).addClass('ui-selected');
    }
    addLog({ tool: 'translate', selected_cells: selectedCopy, row_change: yChange, col_change: xChange });
}

function rotateCells() {
    var currCells = LAYERS[currentLayerIndex].cells;
    var selectedCells = new Array();
    var ind = new Array();
    $('.edition_grid').find('.ui-selected').each(function (i, cell) {
        var row = $(cell).attr('x');
        var col = $(cell).attr('y');
        for (var j = 0; j < currCells.length; j++) {
            if (currCells[j].row == row && currCells[j].col == col && currCells[j].val > 0) {
                ind.push(j);
            }
        }
    });
    var nonEmptyCells = [];
    var selectedCopy = [];
    ind.forEach(function (idx) {
        nonEmptyCells.push(currCells[idx]);
        currCell = currCells[idx];
        selectedCopy.push(new Cell(currCell.row, currCell.col, currCell.val, currCell.selected));
    })
    var currCellsRow = nonEmptyCells.map(cell => cell.row);
    var currCellsCol = nonEmptyCells.map(cell => cell.col);
    var minRow = Math.min(...currCellsRow);
    var maxRow = Math.max(...currCellsRow);
    var minCol = Math.min(...currCellsCol);
    var maxCol = Math.max(...currCellsCol);
    var height = maxRow - minRow + 1;
    var width = maxCol - minCol + 1;
    ind.forEach(function (idx) {
        var cell = currCells[idx];
        var newCol = -(parseInt(cell.row) - maxRow + Math.floor(height / 2)) + maxCol - Math.floor(width / 2) + ((height % 2 == 0));
        var newRow = (parseInt(cell.col) - maxCol + Math.floor(width / 2)) + maxRow - Math.floor(height / 2);
        currCells[idx].row = (newRow);
        currCells[idx].col = (newCol);
        selectedCells.push(new Cell(currCells[idx].row, currCells[idx].col, currCells[idx].val));
    });
    var validCells = selectedCells.filter(cell => cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width);
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    for (var i = 0; i < validCells.length; i++) {
        $('.edition_grid').find(`[x=${validCells[i].row}][y=${validCells[i].col}]`).addClass('ui-selected');
    }
    addLog({ tool: 'rotate', selected_cells: selectedCopy })
}

function reflectX() {
    var currCells = LAYERS[currentLayerIndex].cells;
    var selectedCells = new Array();
    var ind = new Array();
    $('.edition_grid').find('.ui-selected').each(function (i, cell) {
        var row = $(cell).attr('x');
        var col = $(cell).attr('y');
        for (var j = 0; j < currCells.length; j++) {
            if (currCells[j].row == row && currCells[j].col == col && currCells[j].val > 0) {
                ind.push(j);
            }
        }
    });
    var nonEmptyCells = [];
    var selectedCopy = [];
    ind.forEach(function (idx) {
        nonEmptyCells.push(currCells[idx]);
        currCell = currCells[idx];
        selectedCopy.push(new Cell(currCell.row, currCell.col, currCell.val, currCell.selected));
    })
    var currCellsRow = nonEmptyCells.map(cell => cell.row);
    var currCellsCol = nonEmptyCells.map(cell => cell.col);
    var minRow = Math.min(...currCellsRow);
    var maxRow = Math.max(...currCellsRow);
    ind.forEach(function (idx) {
        var cell = currCells[idx];
        var newCol = cell.col;
        var newRow = maxRow - cell.row + minRow;
        currCells[idx].row = (newRow);
        currCells[idx].col = (newCol);
        selectedCells.push(new Cell(currCells[idx].row, currCells[idx].col, currCells[idx].val));
    });
    var validCells = selectedCells.filter(cell => cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width);
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    for (var i = 0; i < validCells.length; i++) {
        $('.edition_grid').find(`[x=${validCells[i].row}][y=${validCells[i].col}]`).addClass('ui-selected');
    }
    addLog({ tool: 'reflectX', selected_cells: selectedCopy });
}

function reflectY() {
    var currCells = LAYERS[currentLayerIndex].cells;
    var selectedCells = new Array();
    var ind = new Array();
    $('.edition_grid').find('.ui-selected').each(function (i, cell) {
        var row = $(cell).attr('x');
        var col = $(cell).attr('y');
        for (var j = 0; j < currCells.length; j++) {
            if (currCells[j].row == row && currCells[j].col == col && currCells[j].val > 0) {
                ind.push(j);
            }
        }
    });
    var nonEmptyCells = [];
    var selectedCopy = [];
    ind.forEach(function (idx) {
        nonEmptyCells.push(currCells[idx]);
        currCell = currCells[idx];
        selectedCopy.push(new Cell(currCell.row, currCell.col, currCell.val, currCell.selected));
    })
    var currCellsRow = nonEmptyCells.map(cell => cell.row);
    var currCellsCol = nonEmptyCells.map(cell => cell.col);
    var minRow = Math.min(...currCellsRow);
    var maxRow = Math.max(...currCellsRow);
    var minCol = Math.min(...currCellsCol);
    var maxCol = Math.max(...currCellsCol);
    ind.forEach(function (idx) {
        var cell = currCells[idx];
        var newCol = maxCol - cell.col + minCol;
        var newRow = cell.row;
        currCells[idx].row = (newRow);
        currCells[idx].col = (newCol);
        selectedCells.push(new Cell(currCells[idx].row, currCells[idx].col, currCells[idx].val));
    });
    var validCells = selectedCells.filter(cell => cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width);
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    for (var i = 0; i < validCells.length; i++) {
        $('.edition_grid').find(`[x=${validCells[i].row}][y=${validCells[i].col}]`).addClass('ui-selected');
    }
    addLog({ tool: 'reflectY', selected_cells: selectedCopy });
}

function undo() {
    if (logs.action_sequence.length <= 1) {
        return;
    }
    redoStates.push(logsWithUndo.removeAction());
    var lastState = logsWithUndo.lastAction();
    $('#output_grid_size').val(`${lastState.grid.length}x${lastState.grid[0].length}`);
    LAYERS = [];
    lastState.layer_list.forEach(function (layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        var cells = [];
        jsonLayer.cells.forEach(function(cell) {
            cells.push(new Cell(cell['row'], cell['col'], cell['val']));
        });
        LAYERS.push(new Layer(cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    currentLayerIndex = lastState.currentLayer;
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    addLog({ tool: 'undo' }, 0, true);
}

function redo() {
    if (!redoStates.length) {
        return;
    }
    var lastState = redoStates.pop();
    logsWithUndo.action_sequence.push(lastState);
    $('#output_grid_size').val(`${lastState.grid.length}x${lastState.grid[0].length}`);
    LAYERS = [];
    lastState.layer_list.forEach(function (layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        var cells = [];
        jsonLayer.cells.forEach(function(cell) {
            cells.push(new Cell(cell['row'], cell['col'], cell['val']));
        });
        LAYERS.push(new Layer(cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    currentLayerIndex = lastState.currentLayer;
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    addLog({tool : 'redo'}, 0, true);
}

// Initial event binding.

$(window).load(function () {
    $.getJSON(
        "/tasklist"
    ).done(function (data) {
        TASKLIST = data;
        types = ['MiniARC', 'task1', 'task2'];
        types.forEach(function (t) {
            task_with_type = TASKLIST.filter(task => task['type'] == t);
            $(`<h3 class="task_type">${t}</h3><p></p>`).appendTo($('#task_side_nav'))
            for (var i = 0; i < task_with_type.length; i++) {
                task_item = $(`<a onclick=loadTaskFromDb("${task_with_type[i]['task_name']}")>${task_with_type[i]['task_name']}</a>`);
                task_item.appendTo($('#task_list'));
            }
            $('<hr>').appendTo($('#task_list'));
        })
    })
})

$(document).ready(function () {
    $('#symbol_picker').find('.symbol_preview').click(function (event) {
        symbol_preview = $(event.target);
        $('#symbol_picker').find('.symbol_preview').each(function (i, preview) {
            $(preview).removeClass('selected-symbol-preview');
        })
        symbol_preview.addClass('selected-symbol-preview');

        toolMode = $('input[name=tool_switching]:checked').val();
        var selectedCells = [];
        if (toolMode == 'select') {
            selectedCells = [];
            $('.edition_grid').find('.ui-selected').each(function (i, cell) {
                symbol = getSelectedSymbol();
                setCellSymbol($(cell), symbol);
                selectedCells.push(new Cell($(cell).attr('x'), $(cell).attr('y'), symbol));
                LAYERS[currentLayerIndex].addCell(new Cell($(cell).attr('x'), $(cell).attr('y'), $(cell).attr('symbol'), true));
                selectedCells.push(new Cell($(cell).attr('x'), $(cell).attr('y'), $(cell).attr('symbol')));
            });
            makeGridFromLayer();
            selectedCells.forEach(function(cell) {
                $('.edition_grid').find(`[x=${cell.row}][y=${cell.col}]`).addClass('ui-selected');
            });
            addLog({ tool: 'select_fill', selected_cells: selectedCells });
        }
        LAYERS[currentLayerIndex].cells = LAYERS[currentLayerIndex].cells.filter(cell => cell.val > 0);
        updateLayer(currentLayerIndex);
    });

    $('.edition_grid').each(function (i, jqGrid) {
        setUpEditionGridListeners($(jqGrid));
    });

    $('.load_task').on('change', function (event) {
        loadTaskFromFile(event);
    });

    $('.load_task').on('click', function (event) {
        event.target.value = "";
    });

    $('button[id=prev_example]').click(function () {
        if (currentExample != 0) {
            currentExample = currentExample - 1;
            addLog({ tool: "change_example", example: currentExample });
        }
        // currentExample = Math.max(0, currentExample-1);
        $('#current_example_id').html(currentExample + 1);
        fillPairPreview(EXAMPLES[currentExample][0], EXAMPLES[currentExample][1]);
    });

    $('button[id=next_example]').click(function () {
        if (currentExample != EXAMPLES.length - 1) {
            currentExample = currentExample + 1;
            addLog({ tool: "change_example", example: currentExample });
        }
        $('#current_example_id').html(currentExample + 1);
        fillPairPreview(EXAMPLES[currentExample][0], EXAMPLES[currentExample][1]);
    });

    $('input[type=radio][name=tool_switching]').change(function () {
        initializeSelectable();
    });

    $('button[name=tool_switching][id=tool_clear_selection]').click(function () {
        $('.ui-selected').removeClass('ui-selected');
        LAYERS[currentLayerIndex].cells.forEach(function (selected) {
            selected.unselect();
        })
    });

    $('input[type=text][name=size]').on('keydown', function (event) {
        if (event.keyCode == 13) {
            resizeOutputGrid();
        }
    });

    $('.add_layer').on('click', function (event) {
        currentLayerIndex = LAYERS.length;
        LAYERS.push(new Layer(new Array(), LAYERS.length, CURRENT_OUTPUT_GRID.height, CURRENT_OUTPUT_GRID.width, LAYERS.length));
        updateAllLayers();
        initLayerPreview();
        addLog({ tool: 'addLayer' });
    });

    $('body').keydown(function (event) {
        // Copy and paste functionality.
        if (event.which == 67) {
            // Press C

            selected = $('.ui-selected');
            if (selected.length == 0) {
                return;
            }

            COPY_PASTE_DATA = [];
            for (var i = 0; i < selected.length; i++) {
                x = parseInt($(selected[i]).attr('x'));
                y = parseInt($(selected[i]).attr('y'));
                symbol = parseInt($(selected[i]).attr('symbol'));
                source = $(selected[i]).parent().parent().attr('id');
                if (symbol > 0) {
                    COPY_PASTE_DATA.push([x, y, symbol, source]);
                }
            }
            infoMsg('Cells copied! Select a target cell and press V to paste at location.');
            addLog({ tool: 'copy', copy_paste_data: COPY_PASTE_DATA });
        }
        if (event.which == 86) {
            // Press V
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.edition_grid').find('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                selectedCell = selected[0];
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                for (var i = 0; i < xs.length; i++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = x - minx + targetx;
                    newy = y - miny + targety;
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol);
                        LAYERS[currentLayerIndex].addCell(new Cell($(cell).attr('x'), $(cell).attr('y'), $(cell).attr('symbol')));
                        updateAllLayers();
                    }
                }
                makeGridFromLayer();
                addLog({ tool: 'paste', copy_paste_data: COPY_PASTE_DATA, row: $(selected).attr('x'), col: $(selected).attr('y') });
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
            $('.ui-selected').removeClass('ui-selected');
        }

        if (event.which == 89) { // reflection across y-axis, axis on the middle
            // Press Y
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.edition_grid').find('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);

                newys = ys.map((v) => { return (v - miny + targety) });
                newminy = Math.min(...newys);
                newmaxy = Math.max(...newys);

                for (var i = 0; i < xs.length; i++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = x - minx + targetx;
                    newy = (newmaxy + newminy) - newys[i];
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol);
                        LAYERS[currentLayerIndex].addCell(new Cell($(cell).attr('x'), $(cell).attr('y'), $(cell).attr('symbol')));
                        updateAllLayers();
                    }
                }
                addLog({ tool: 'reflectY', copy_paste_data: COPY_PASTE_DATA, row: $(cell).attr('x'), col: $(cell).attr('y') });
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }

        if (event.which == 88) { // reflection across x-axis, axis on the middle
            // Press X
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.edition_grid').find('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);

                newxs = xs.map((v) => { return (v - minx + targetx) });
                newminx = Math.min(...newxs);
                newmaxx = Math.max(...newxs);

                for (var i = 0; i < xs.length; i++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = (newmaxx + newminx) - newxs[i];
                    newy = y - miny + targety;
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol);
                        LAYERS[currentLayerIndex].addCell(new Cell($(cell).attr('x'), $(cell).attr('y'), $(cell).attr('symbol')));
                        updateAllLayers();
                    }
                }
                addLog({ tool: 'reflectX', copy_paste_data: COPY_PASTE_DATA, row: $(cell).attr('x'), col: $(cell).attr('y') });
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }

        if (event.which == 65 || event.which == 37) {
            // Left arrow
            translateCells(-1, 0);
        }
        if (event.which == 87 || event.which == 38) {
            // Up arrow
            translateCells(0, -1);
        }
        if (event.which == 68 || event.which == 39) {
            // Right arrow
            translateCells(1, 0);
        }
        if (event.which == 83 || event.which == 40) {
            // Down arrow
            translateCells(0, 1);
        }

        if (event.which == 82) {
            rotateCells();
        }

        // undo and redo
        if (keyState['Control'] && keyState['Shift'] && event.which == 90) {
            redo();
        } else if (keyState['Control'] && event.which == 90) {
            undo();
        }
    });


});
