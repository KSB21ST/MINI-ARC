
// Internal state.
var CURRENT_INPUT_GRID = new Grid(5, 5);
var CURRENT_OUTPUT_GRID = new Grid(5, 5);
var TEST_PAIRS = new Array();
var CURRENT_TEST_PAIR_INDEX = 0;
var COPY_PASTE_DATA = new Array();
var SELECTED_DATA = new Array();
var LAYERS = new Array();
var TESTSETS = new Array();
TESTSETS.push(new TESTSET());
LAYERS.push(new Layer(new Array(), 0, 5, 5, 0));
var currentLayerIndex = 0;
var EXAMPLES = new Array();
var currentExample = 0;
var tries = 0;
var logSaved = false;
const NUM_ROWS = 5;
const NUM_COLS = 5;

// Cosmetic.
var EDITION_GRID_HEIGHT = 300;
var EDITION_GRID_WIDTH = 300;
var MAX_CELL_SIZE = 100;
var PREVIEW_GRID_SIZE = 75;

// Logs
var logs = new Log("", "");
var redoStates = new Array();

// user id
const user_id = Date.now().toString(36) + Math.random().toString(36).substr(2);

// time
var prevTime = 0
var currTime = 0

var keyState = {};
onkeydown = onkeyup = (event) => {
    keyState[event.key] = (event.type == 'keydown');
}

function addLog(action) {
    currTime = new Date()
    var time = currTime - prevTime
    prevTime = currTime

    redoStates = [];
    var gridCopy = [];
    for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
        gridCopy[i] = CURRENT_OUTPUT_GRID.grid[i].slice();
    }
    var layerCopy = [];
    LAYERS.forEach(function(layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        layerCopy.push(new Layer(jsonLayer.cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    logs.addAction(
        action,
        gridCopy,
        currentLayerIndex,
        layerCopy,
        time
    );
}

function resetTask() {
    prevTime = new Date()
    tries = 0;
    logSaved = false;
    CURRENT_INPUT_GRID = new Grid(3, 3);
    TEST_PAIRS = new Array();
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#task_preview').html('');
    resetOutputGrid();
    EXAMPLES = [];
    LAYERS = new Array();
    LAYERS.push(new Layer(new Array(), 0, 3, 3, 0));
    currentLayerIndex = 0;
    currentExample = 0;
    updateAllLayers();
    initLayerPreview();
}

function refreshEditionGrid(jqGrid, dataGrid) {
    fillJqGridWithData(jqGrid, dataGrid);
    setUpEditionGridListeners(jqGrid);
    fitCellsToContainer(jqGrid, dataGrid.height, dataGrid.width, EDITION_GRID_HEIGHT, EDITION_GRID_HEIGHT);
    initializeSelectable();
}

function syncFromEditionGridToDataGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
    copyJqGridToDataGrid($('#input_grid .edition_grid'), CURRENT_INPUT_GRID);
}

function syncFromDataGridToEditionGrid() {
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
    refreshEditionGrid($('#input_grid .edition_grid'), CURRENT_INPUT_GRID);
}

function getSelectedSymbol() {
    selected = $('#symbol_picker .selected-symbol-preview')[0];
    return $(selected).attr('symbol');
}

function setUpEditionGridListeners(jqGrid) {
    jqGrid.find('.cell').click(function(event) {
        cell = $(event.target);
        var parentGrid = cell.parent().parent().parent().attr('id');
        console.log(parentGrid)
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
            if (parentGrid == 'input_grid') {
                grid = CURRENT_INPUT_GRID.grid;
            } else {
                grid = CURRENT_OUTPUT_GRID.grid;
            }
            affectedCells = floodfillFromLocation(grid, cell.attr('x'), cell.attr('y'), symbol);
            for (var i = 0; i < affectedCells.length; i++) {
                var currCell = affectedCells[i]
                if (parentGrid == 'input_grid') {
                    TESTSETS[currentExample].input_cells[currCell.row][currCell.col] = currCell.val
                } else {
                    TESTSETS[currentExample].output_cells[currCell.row][currCell.col] = currCell.val
                }
            }
            initLayerPreview();
            syncFromDataGridToEditionGrid();
        }
        else if (mode == 'edit') {
            // Else: fill just this cell.
            setCellSymbol(cell, symbol);
            var row = cell.attr('x');
            var col = cell.attr('y');
            if (TESTSETS.length != 0) {
                if (parentGrid == 'input_grid') {
                    TESTSETS[currentExample].input_cells[row][col] = symbol;
                } else if (parentGrid == 'output_grid') {
                    TESTSETS[currentExample].output_cells[row][col] = symbol;
                }
            }
            initLayerPreview();
            syncFromEditionGridToDataGrid();
        }
        updateLayer(currentLayerIndex);
    });
}

function resizeOutputGrid() {
    size = $('#output_grid_size').val();
    height = 5;
    width = 5;

    jqGrid = $('#output_grid .edition_grid');
    syncFromEditionGridToDataGrid();
    dataGrid = JSON.parse(JSON.stringify(CURRENT_OUTPUT_GRID.grid));
    CURRENT_OUTPUT_GRID = new Grid(height, width, dataGrid);
    refreshEditionGrid(jqGrid, CURRENT_OUTPUT_GRID);
    
    for (var i = 0; i < LAYERS.length; i++) {
        LAYERS[i].height = CURRENT_OUTPUT_GRID.height;
        LAYERS[i].width = CURRENT_OUTPUT_GRID.width;
    }
    updateAllLayers();
    initLayerPreview();
}

function resetOutputGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
    CURRENT_OUTPUT_GRID = new Grid(5, 5);
    var blank = new Grid(5,5);
    TESTSETS[currentExample].output_cells = blank.grid;
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
    initLayerPreview();
    var layerSlot = $('#layer_' + currentExample);
    layerSlot.val('checked', true);
}

function resetInputGrid() {
    copyJqGridToDataGrid($('#input_grid .edition_grid'), CURRENT_INPUT_GRID);
    CURRENT_INPUT_GRID = new Grid(5, 5);
    var blank = new Grid(5,5);
    TESTSETS[currentExample].input_cells = blank.grid;
    refreshEditionGrid($('#input_grid .edition_grid'), CURRENT_INPUT_GRID);
    initLayerPreview();
}

function copyFromInput() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = convertSerializedGridToGridObject(CURRENT_INPUT_GRID.grid);
    syncFromDataGridToEditionGrid();
    currLayer = LAYERS[currentLayerIndex];
    currLayer.updateGrid(CURRENT_OUTPUT_GRID);
    for (var i = 0; i < LAYERS.length; i++) {
        LAYERS[i].height = CURRENT_OUTPUT_GRID.height;
        LAYERS[i].width = CURRENT_OUTPUT_GRID.width;
    }
    initLayerPreview();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
    addLog({tool: 'copyFromInput'});
}

function fillPairPreview(inputGrid, outputGrid) {
    var pairSlot = $('#pair_preview');
    if (!pairSlot.length) {
        // Create HTML for pair.
        pairSlot = $('<div id="pair_preview" class="pair_preview"></div>');
        pairSlot.appendTo('#task_preview');
    }
    var jqInputGrid = pairSlot.find('.input_preview');
    if (jqInputGrid.length) {
        jqInputGrid.remove('.input_preview');
    }
    jqInputGrid = $('<div class="input_preview"></div>');
    jqInputGrid.appendTo(pairSlot);

    var jqOutputGrid = pairSlot.find('.output_preview');
    if (jqOutputGrid.length) {
        jqOutputGrid.remove('.output_preview');
    }
    jqOutputGrid = $('<div class="output_preview"></div>');
    jqOutputGrid.appendTo(pairSlot);

    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, outputGrid.height, outputGrid.width, 200, 200);
}

function fillLayerPreview(layerId) {
    var layerSlot = $('#layer_' + layerId);
    var exampleSlot = $('#example_' + layerId);
    if (!layerSlot.length) {
        layerSlot = $('<div id ="layer_' + layerId + '" class="layer_preview container-fluid" value="' + layerId + '"><div class="row justify-content-center gx-3"><input type="radio" class="layer_button" name="layer" id="' + layerId + '" value="' + layerId + '" checked><label for="' + layerId + '" class="layer_selector"></label><div class="input_preview col-sm-auto"></div><div class="col-1"><p>&#8594;</p></div><div class="output_preview col-sm-auto"></div></div>');
        layerSlot.appendTo(`#layer_panel`);
        exampleSlot = $('<div id ="example_' + layerId + '" class="example_preview container-fluid" value="' + layerId + '"><div class="row justify-content-center gx-3"><div class="input_preview col-sm-auto"></div><div class="col-1"><p>&#8594;</p></div><div class="output_preview col-sm-auto"></div></div><p></p>');
        exampleSlot.appendTo(`#example_panel`);
        $(`input[type=radio][id=${layerId}]`).click(function() {
            initializeSelectable();
            initializeLayerChange();
        })
    }

    var jqInputGrid = layerSlot.find('.input_preview');
    var jqOutputGrid = layerSlot.find('.output_preview');

    inputGrid = new Grid(5,5,TESTSETS[layerId].input_cells);
    outputGrid = new Grid(5,5,TESTSETS[layerId].output_cells);
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, 5, 5, PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, 5, 5, PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE);

    jqInputGrid = exampleSlot.find('.input_preview');
    jqOutputGrid = exampleSlot.find('.output_preview');

    inputGrid = new Grid(5,5,TESTSETS[layerId].input_cells);
    outputGrid = new Grid(5,5,TESTSETS[layerId].output_cells);
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, 5, 5, PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, 5, 5, PREVIEW_GRID_SIZE, PREVIEW_GRID_SIZE);
}

function initLayerPreview() {
    $('.layer_preview').remove();
    $('.example_preview').remove();
    for (var id = 0; id < TESTSETS.length; id++) {
        fillLayerPreview(id);
    }
}

function loadJSONTask(train, test) {
    initLayerPreview();

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
        EXAMPLES.push([input_grid, output_grid]);
    }
    fillPairPreview(EXAMPLES[0][0], EXAMPLES[0][1]);
    $('#current_example_id').html('1');
    $('#total_examples').html(EXAMPLES.length);
    for (var i=0; i < test.length; i++) {
        pair = test[i];
        TEST_PAIRS.push(pair);
    }
    values = TEST_PAIRS[0]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);
    CURRENT_TEST_PAIR_INDEX = 0;
    $('#current_test_input_id_display').html('1');
    $('#total_test_input_count_display').html(test.length);
    initializeSelectable();
}

function display_task_name(task_name, task_index, number_of_tasks) {
    big_space = '&nbsp;'.repeat(4); 
    document.getElementById('task_name').innerHTML = (
        'Task name:' + big_space + task_name + big_space 
    );
}

function loadTaskFromFile(e) {
    var file = e.target.files[0];
    if (!file) {
        errorMsg('No file selected');
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
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
    };
    reader.readAsText(file);
}

function randomTask() {
    var subset = "training";
    $.getJSON("https://api.github.com/repos/fchollet/ARC/contents/data/" + subset, function(tasks) {
        var task_index = Math.floor(Math.random() * tasks.length)
        var task = tasks[task_index];
        $.getJSON(task["download_url"], function(json) {
            try {
                train = json['train'];
                test = json['test'];
            } catch (e) {
                errorMsg('Bad file format');
                return;
            }
            logs = new Log(task['name'].split('.')[0], user_id);
            loadJSONTask(train, test);
            infoMsg("Loaded task training/" + task["name"]);
            display_task_name(task['name'], task_index, tasks.length);
        })
        .error(function(){
          errorMsg('Error loading task');
        });
    })
    .error(function(){
      errorMsg('Error loading task list');
    });
}

function nextTestInput() {
    if (TEST_PAIRS.length <= CURRENT_TEST_PAIR_INDEX + 1) {
        errorMsg('No next test input. Pick another file?')
        return
    }
    CURRENT_TEST_PAIR_INDEX += 1;
    values = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['input'];
    CURRENT_INPUT_GRID = convertSerializedGridToGridObject(values)
    fillTestInput(CURRENT_INPUT_GRID);
    $('#current_test_input_id_display').html(CURRENT_TEST_PAIR_INDEX + 1);
    $('#total_test_input_count_display').html(test.length);
}

function newExample() {
    TESTSETS.push(new TESTSET());
    currentExample = TESTSETS.length - 1;
    resetInputGrid();
    resetOutputGrid();
    initLayerPreview();
}

function deleteExample() {
    if (TESTSETS.length <= 1) {
        return;
    }
    TESTSETS.splice(currentExample, 1);
    currentExample -= 1;
    initLayerPreview();
    $("#layer_"+(currentExample-1)).prop("checked", true)
    initializeLayerChange();
}

function reloadExample() {
    const queryString = window.location.href;
    const params = queryString.split('/')
    var myData = {
        'index': params[4],
    }
    $.ajax({
        type: 'GET',
        url: '/testset/queryone',
        data: myData,
        dataType: 'json',
        async: false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(data) {
        TESTSETS = new Array();
        $.each( data, function( i, item ) {
            testSet = JSON.parse(JSON.parse(item.testjson)['testArray'])
            testSet.forEach((p) => {
                TESTSETS.push(new TESTSET(p.input_cells, p.output_cells));
                console.log(p.input_cells, p.output_cells, TESTSETS)
            })
        });
    });
    currentExample = TESTSETS.length - 1;
    initLayerPreview();
    initializeLayerChange()
}

function submitFinalTestSet() {
    console.log(TESTSETS)
    var user_id = $('#user_id').val();
    var description = $('#task_description').val();
    if (user_id.length == 0 || description.length == 0) {
        const unsuccessful_toast = new bootstrap.Toast($('#unsuccessful_submit'))
        unsuccessful_toast.show();
        return;
    }
    var testData = 
    {
        'user_id': user_id,
        'description': description,
        'test_id': Date.now().toString(36) + Math.random().toString(36).substr(2),
        'testArray': JSON.stringify(TESTSETS),
        'Description': description	
    }
    $.ajax({
        type: 'POST',
        url: '/testset/submit',
        data: JSON.stringify(testData),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8'
    }).done(function(msg) {
        console.log("Testset Saved: \n" + TESTSETS.getString());
    });
    resetInputGrid();
    resetOutputGrid();
    TESTSETS = new Array();
    TESTSETS.push(new TESTSET());
    currentExample = 0;
    $('.layer_preview').remove();
    $('.example_preview').remove();
    initLayerPreview();
    const toast = new bootstrap.Toast($('#successful_submit'))
    toast.show();
    $('#task_description').val("");
}

function fillTestInput(inputGrid) {
    jqInputGrid = $('#evaluation_input');
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
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
                filter: '> .row > .cell'
            }
        );
    }
}

function initializeLayerChange() {
    currentExample = $('input[name=layer]:checked').val();
    console.log(currExample);
    var currExample = TESTSETS[currentExample];
    console.log(currExample);
    for (var r = 0; r < NUM_ROWS; r++) {
        for (var c = 0; c < NUM_COLS; c++) {
            setCellSymbol($('#input_grid').find(`[x=${r}][y=${c}]`), currExample.input_cells[r][c]);
            setCellSymbol($('#output_grid').find(`[x=${r}][y=${c}]`), currExample.output_cells[r][c]);
        }
    }
    syncFromEditionGridToDataGrid();
}

function updateLayer(id) {
    var layerSlot = $('#layer_' + id);
    var jqInputGrid = layerSlot.find('.grid_preview');
    var layer = LAYERS.find(layer => layer.id == id);
    if (layer == undefined) {
        return;
    }
    var layerGrid = layer.getGrid();
    fillJqGridWithData(jqInputGrid, layerGrid);
    fitCellsToContainer(jqInputGrid, layerGrid.height, layerGrid.width, 100, 100);
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
    }else{
        targetx = parseInt(selected.attr('x'));
        targety = parseInt(selected.attr('y'));
    }

        xs = SELECTED_DATA.map((cell) => {return cell[0]});
        ys = SELECTED_DATA.map((cell) => {return cell[1]});
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
}

function updateAllLayers() {
    for (var i = 0; i < LAYERS.length; i++) {
        updateLayer(i);
    }
}

function makeGridFromLayer() {
    zSorted = LAYERS.sort(function(l1, l2) { l2.z - l1.z });
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
    var currLayer = LAYERS[currentLayerIndex].cells;
    var selectedCells = new Array();
    var ind = new Array();
    $('.edition_grid').find('.ui-selected').each(function(i, cell) {
        var row = $(cell).attr('x');
        var col = $(cell).attr('y');
        for (var j = 0; j < currLayer.length; j++) {
            if (currLayer[j].row == row && currLayer[j].col == col && currLayer[j].val > 0) {
                ind.push(j);
            }
        }
    });
    console.log(ind);
    ind.forEach(function(idx) {
        currLayer[idx].row = (parseInt(currLayer[idx].row) + yChange);
        currLayer[idx].col = (parseInt(currLayer[idx].col) + xChange);
        selectedCells.push(new Cell(currLayer[idx].row, currLayer[idx].col, currLayer[idx].val));
    });
    LAYERS[currentLayerIndex].cells = LAYERS[currentLayerIndex].cells.filter(cell => cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width);
    $('.ui-selected').removeClass('ui-selected');
    var validCells = selectedCells.filter(cell => cell.row >= 0 && cell.col >= 0 && cell.row < CURRENT_OUTPUT_GRID.height && cell.col < CURRENT_OUTPUT_GRID.width);
    console.log(validCells);
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
    for (var i = 0; i < validCells.length; i++) {
        $('.edition_grid').find(`[x=${validCells[i].row}][y=${validCells[i].col}]`).addClass('ui-selected');
    }
    addLog({tool: 'translate', selected_cells: validCells, row_change: yChange, col_change: xChange});
}

function rotateCells() {
    var currCells = LAYERS[currentLayerIndex].cells;
    var selectedCells = new Array();
    var ind = new Array();
    $('.edition_grid').find('.ui-selected').each(function(i, cell) {
        var row = $(cell).attr('x');
        var col = $(cell).attr('y');
        for (var j = 0; j < currCells.length; j++) {
            if (currCells[j].row == row && currCells[j].col == col && currCells[j].val > 0) {
                ind.push(j);
            }
        }
    });
    var nonEmptyCells = [];
    ind.forEach(function(idx) {
        nonEmptyCells.push(currCells[idx]);
    })
    var currCellsRow = nonEmptyCells.map(cell => cell.row);
    var currCellsCol = nonEmptyCells.map(cell => cell.col);
    var minRow = Math.min(...currCellsRow);
    var maxRow = Math.max(...currCellsRow);
    var minCol = Math.min(...currCellsCol);
    var maxCol = Math.max(...currCellsCol);
    var height = maxRow - minRow + 1;
    var width = maxCol - minCol + 1;
    ind.forEach(function(idx) {
        var cell = currCells[idx];
        var newCol = -(parseInt(cell.row) - maxRow + Math.floor(height/2)) + maxCol - Math.floor(width/2) + ((height%2 == 0));
        var newRow = (parseInt(cell.col) - maxCol + Math.floor(width/2)) + maxRow - Math.floor(height/2);
        console.log(newCol + ' ' + newRow);
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
    addLog({tool: 'rotate', selected_cells: validCells})
}

function undo() {
    if (logs.action_sequence.length <= 1) {
        return;
    }
    redoStates.push(logs.removeAction());
    var lastState = logs.action_sequence[logs.action_sequence.length-1];
    $('#output_grid_size').val(`${lastState.grid.length}x${lastState.grid[0].length}`);
    LAYERS = [];
    lastState.layer_list.forEach(function(layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        LAYERS.push(new Layer(jsonLayer.cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    currentLayerIndex = lastState.currentLayer;
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
}

function redo() {
    if (!redoStates.length) {
        return;
    }
    logs.action_sequence.push(redoStates.pop());
    var lastState = logs.action_sequence[logs.action_sequence.length-1];
    $('#output_grid_size').val(`${lastState.grid.length}x${lastState.grid[0].length}`);
    LAYERS = [];
    lastState.layer_list.forEach(function(layer) {
        var jsonLayer = JSON.parse(JSON.stringify(layer));
        LAYERS.push(new Layer(jsonLayer.cells, jsonLayer.z, jsonLayer.height, jsonLayer.width, jsonLayer.id));
    });
    currentLayerIndex = lastState.currentLayer;
    updateAllLayers();
    initLayerPreview();
    makeGridFromLayer();
}

function viewpage(newurl){
    console.log("viewpage")
    var urlString = location.href;
    console.log(urlString.split('/'))
    var oldURL = '/testset'
    var changeURL = newurl
    var newURL=""
    if (urlString.split('/').length === 5) {
        var urlsplit = urlString.split('/')
        var newURL = oldURL + '/' + urlsplit[4]
        window.location.replace(urlString.replace(newURL, changeURL));
    }
    else if (urlString.match(oldURL)){
        window.location.replace(urlString.replace(oldURL, changeURL));
    }
}

// Initial event binding.


$(document).ready(function () {
    initLayerPreview();
    $('#symbol_picker').find('.symbol_preview').click(function(event) {
        symbol_preview = $(event.target);
        $('#symbol_picker').find('.symbol_preview').each(function(i, preview) {
            $(preview).removeClass('selected-symbol-preview');
        })
        symbol_preview.addClass('selected-symbol-preview');

        toolMode = $('input[name=tool_switching]:checked').val();
        if (toolMode == 'select') {
            $('.edition_grid').find('.ui-selected').each(function(i, cell) {
                symbol = getSelectedSymbol();
                setCellSymbol($(cell), symbol);
                var parentGrid = $(cell).parent().parent().parent().attr('id');
                var row = $(cell).attr('x');
                var col = $(cell).attr('y');
                if (parentGrid == 'input_grid') {
                    TESTSETS[currentExample].input_cells[row][col] = symbol;
                } else {
                    TESTSETS[currentExample].output_cells[row][col] = symbol;
                }
            });
        }
        initLayerPreview();
        syncFromEditionGridToDataGrid();
    });

    $('.edition_grid').each(function(i, jqGrid) {
        setUpEditionGridListeners($(jqGrid));
    });

    $('.load_task').on('change', function(event) {
        loadTaskFromFile(event);
    });

    $('.load_task').on('click', function(event) {
      event.target.value = "";
    });

    $('button[id=prev_example]').click(function() {
        if (currentExample != 0) {
            currentExample = currentExample - 1;
            addLog({ tool: "change_example", example: currentExample });
        }
        $('#current_example_id').html(currentExample+1);
        fillPairPreview(EXAMPLES[currentExample][0], EXAMPLES[currentExample][1]);
    });

    $('button[id=next_example]').click(function() {
        if (currentExample != EXAMPLES.length-1) {
            currentExample = currentExample + 1;
            addLog({ tool: "change_example", example: currentExample });
        }
        $('#current_example_id').html(currentExample+1);
        fillPairPreview(EXAMPLES[currentExample][0], EXAMPLES[currentExample][1]);
    });

    $('input[type=radio][name=tool_switching]').change(function() {
        initializeSelectable();
    });

    $('button[id=tool_clear_selection]').click(function() {
        $('.ui-selected').removeClass('ui-selected');
    });
    
    $('input[type=text][name=size]').on('keydown', function(event) {
        if (event.keyCode == 13) {
            resizeOutputGrid();
        }
    });

    $('.add_layer').on('click', function(event) {
        currentLayerIndex = LAYERS.length;
        LAYERS.push(new Layer(new Array(), LAYERS.length, CURRENT_OUTPUT_GRID.height, CURRENT_OUTPUT_GRID.width, LAYERS.length));
        updateAllLayers();
        initLayerPreview();
        addLog({tool: 'addLayer'});
    });

    $('body').keydown(function(event) {
        // Copy and paste functionality.
        if (event.which == 67) {
            // Press C

            selected = $('.ui-selected');
            if (selected.length == 0) {
                return;
            }

            COPY_PASTE_DATA = [];
            for (var i = 0; i < selected.length; i ++) {
                x = parseInt($(selected[i]).attr('x'));
                y = parseInt($(selected[i]).attr('y'));
                symbol = parseInt($(selected[i]).attr('symbol'));
                if (symbol > 0) {
                    COPY_PASTE_DATA.push([x, y, symbol]);
                }
            }
            infoMsg('Cells copied! Select a target cell and press V to paste at location.');
            addLog({tool: 'copy', copy_paste_data: COPY_PASTE_DATA});
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
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                for (var i = 0; i < xs.length; i ++) {
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
                addLog({tool: 'paste', copy_paste_data: COPY_PASTE_DATA, row: $(cell).attr('x'), col: $(cell).attr('y')});
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

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                
                newys = ys.map((v) => {return (v - miny + targety)});
                newminy = Math.min(...newys);
                newmaxy = Math.max(...newys);

                for (var i = 0; i < xs.length; i ++) {
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
                addLog({tool: 'reflectY', copy_paste_data: COPY_PASTE_DATA, row: $(cell).attr('x'), col: $(cell).attr('y')});
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

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                
                newxs = xs.map((v) => {return (v - minx + targetx)});
                newminx = Math.min(...newxs);
                newmaxx = Math.max(...newxs);

                for (var i = 0; i < xs.length; i ++) {
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
                addLog({tool: 'reflectX', copy_paste_data: COPY_PASTE_DATA, row: $(cell).attr('x'), col: $(cell).attr('y')});
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }

        if (event.which == 65) {
            // Left arrow
            translateCells(-1, 0);
        }
        if (event.which == 87) {
            // Up arrow
            translateCells(0, -1);
        }
        if (event.which == 68) {
            // Right arrow
            translateCells(1, 0);
        }
        if (event.which == 83) {
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
