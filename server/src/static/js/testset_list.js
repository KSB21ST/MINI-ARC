
// Internal state.
var CURRENT_INPUT_GRID = new Grid(5, 5);
var CURRENT_OUTPUT_GRID = new Grid(5, 5);
var CURRENT_TEST_PAIR_INDEX = 0;
const NUM_ROWS = 5;
const NUM_COLS = 5;

// Cosmetic.
var EDITION_GRID_HEIGHT = 300;
var EDITION_GRID_WIDTH = 300;
var MAX_CELL_SIZE = 100;

// user id
const user_id = Date.now().toString(36) + Math.random().toString(36).substr(2);

// time
var prevTime = 0
var currTime = 0

function fillTestListPreview(TestSet, LayerID) {
    var layerSlot = $('#layer_' + LayerID);
    if (!layerSlot.length) {
        layerSlot = $('<div id ="layer_' + LayerID + '" class="layer_preview" value="' + LayerID + '"><div class="input_preview"></div><div class="output_preview"></div></div>');
        $('#layer_panel').append(layerSlot)
    }

    var jqInputGrid = layerSlot.find('.input_preview');
    var jqOutputGrid = layerSlot.find('.output_preview');

    inputGrid = new Grid(5,5,TestSet.input_cells);
    outputGrid = new Grid(5,5,TestSet.output_cells);
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, 5, 5, 100, 100);
    fillJqGridWithData(jqOutputGrid, outputGrid);
    fitCellsToContainer(jqOutputGrid, 5, 5, 100, 100);
}

function initTestSetPreview(TestSet) {
    for (var id = 0; id < TestSet.length; id++) {
        fillTestListPreview(TestSet[id], id);
    }
}

function showApproveTestSet(id) {
    $.getJSON( '/testset/queryone', {
        index: id,
        tags: "mount rainier",
        tagmode: "any",
        format: "json"
      })
        .done(function( data ) {
            testSet = JSON.parse(JSON.parse(data[0].testjson)['testArray'])
            console.log(testSet);
            initTestSetPreview(testSet)
            $('.cardLabel').remove();
            var layerlabel = $('<div class="cardLabel">' + id + '</div>')
            layerlabel.appendTo('#layer_panel')
        });
}

function showAllTestSet(id) {
    $.getJSON( '/testset/queryone', {
        index: id,
        tags: "mount rainier",
        tagmode: "any",
        format: "json"
      })
        .done(function( data ) {
            testSet = JSON.parse(JSON.parse(data[0].testjson)['testArray'])
            initTestSetPreview(testSet)
            $('.cardLabel').remove();
            var layerlabel = $('<div class="cardLabel">' + id + '</div>')
            layerlabel.appendTo('#layer_panel')
            $('.admin_btn').remove();
            var approve_btn = $('<div class="admin_btn"><button onclick="approveSet(\'' + id + ',1\')" id="approve_solution_btn">Approve</button></div>')
            var disapprove_btn = $('<div class="admin_btn"><button onclick="approveSet(\'' + id + ',0\')" id="disapprove_solution_btn">Disapprove</button></div>')
            approve_btn.appendTo('#layer_panel')
            disapprove_btn.appendTo('#layer_panel')
        });
}

function approveSet(id) {
    test_id = id.split(',')[0]
    approval = id.split(',')[1]
    var apr = false;
    if(approval==='1') {
        apr = true;
    }
    var testData = 
    {
        'test_id': test_id,
        'approve': apr,	
    }
    $.ajax({
        type: 'POST',
        url: '/testset/submit_approval',
        data: JSON.stringify(testData),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8'
    }).done(function(msg) {
        console.log("Testset Saved: \n" + TESTSETS.getString());
    });
}

function fillTestInput(inputGrid) {
    jqInputGrid = $('#evaluation_input');
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
}

