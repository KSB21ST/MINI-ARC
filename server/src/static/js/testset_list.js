
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
        layerSlot = $('<div id ="layer_' + LayerID + '" class="layer_preview" value="' + LayerID + '"><div class="input_preview"></div><div class="arrow"><h6>&#8594;</h6></div><div class="output_preview"></div></div>');
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
    $('.layer_preview').remove();
    for (var id = 0; id < TestSet.length; id++) {
        fillTestListPreview(TestSet[id], id);
    }
}

function editTestSet(id){
    history.pushState(null, null, id)
    window.location.reload();
}

function showDisApproveTestSet(id) {
    $.getJSON( '/testset/queryone', {
        index: id,
        tags: "mount rainier",
        tagmode: "any",
        format: "json"
      })
        .done(function( data ) {
            testSet = JSON.parse(JSON.parse(data[0].testjson)['testArray'])
            test_obj = JSON.parse(data[0].testjson)
            initTestSetPreview(testSet)
            $('.cardLabel').remove();
            var layerlabel = $('<div class="cardLabel"><h6>' + id + '</h6><h6>madeBy: '+test_obj['user_id']+'</h6><h6>'+test_obj['description']+'</h6></div>')
            layerlabel.appendTo('#layer_panel')
            $('.edit_btn').remove();
            var edit_btn = $('<div class="edit_btn"><button onclick="editTestSet(\'' + id + '\')" id="approve_solution_btn">Edit</button></div>')
            edit_btn.appendTo('#layer_panel')
        });
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
            test_obj = JSON.parse(data[0].testjson)
            initTestSetPreview(testSet)
            $('.cardLabel').remove();
            var layerlabel = $('<div class="cardLabel"><h6>' + id + '</h6><h6>madeBy: '+test_obj['user_id']+'</h6><h6>'+test_obj['description']+'</h6></div>')
            layerlabel.appendTo('#layer_panel')
            edit_btn.appendTo('#layer_panel')
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
            var delete_btn = $('<div class="admin_btn"><button onclick="deleteSet(\'' + id + '\')" id="delete_solution_btn">Delete</button></div>')
            approve_btn.appendTo('#layer_panel')
            disapprove_btn.appendTo('#layer_panel')
            delete_btn.appendTo('#layer_panel')
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
        async: false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(msg) {
    });
    location.reload();
}

function deleteSet(id) {
    var testData = 
    {
        'test_id': id,
    }
    $.ajax({
        type: 'POST',
        url: '/testset/delete',
        data: JSON.stringify(testData),
        dataType: 'json',
        async: false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(msg) {
    });
    location.reload();
}

function fillTestInput(inputGrid) {
    jqInputGrid = $('#evaluation_input');
    fillJqGridWithData(jqInputGrid, inputGrid);
    fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);
}

function searchTestSet() {
    console.log("searchTestSet")
    var user_id = $('#user_id').val();
    var description = $('#task_description').val();
    var testData = 
    {
        'user_id': user_id,
        'description': description,
        'approval': '-1'
    }
    $('.cardLabel').remove();
    $('.admin_btn').remove();
    $('.layer_preview').remove();
    $.ajax({
        type: 'GET',
        url: '/testset/search',
        data: testData,
        dataType: 'json',
        async: false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(data) {
        $('.column').remove();
        $.each( data, function( i, item ) {
            testSet = JSON.parse(JSON.parse(item.testjson)['testArray'])
            const json_obj = JSON.parse(item.testjson)
            const testName = JSON.parse(item.testjson)['test_id']
            var cardList = $('<div class="column"><div tabindex="' + i + '" id="cardview_' + i + '" class="card" style="font-size: 10px" onClick="showApproveTestSet(\'' + testName + '\')"><h6>testID: ' + testName.slice(0,9) + '</h6><h6>madeBy: '+json_obj['user_id']+'</h6><h6>'+json_obj['description']+'</h6></div></div>')
            cardList.appendTo('#data_panel')
          });
    });
}

function searchAdminTestSet() {
    var user_id = $('#user_id').val();
    var description = $('#task_description').val();
    var approval = $('#approved').val();
    var disapproval = $('#disapproved').val();
    var testData = 
    {
        'user_id': user_id,
        'description': description,
    }
    if(document.getElementById("approved").checked){
        testData['approval'] = approval
    }else if(document.getElementById("disapproved").checked){
        testData['approval'] = disapproval
    }else{
        testData['approval'] = '-1'
    }
    $('.cardLabel').remove();
    $('.admin_btn').remove();
    $('.layer_preview').remove();
    $.ajax({
        type: 'GET',
        url: '/testset/search',
        data: testData,
        dataType: 'json',
        asyn:false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(data) {
        $('.column').remove();
        $.each( data, function( i, item ) {
            testSet = JSON.parse(JSON.parse(item.testjson)['testArray'])
            const json_obj = JSON.parse(item.testjson)
            const testApprove = item.approve
            const testName = JSON.parse(item.testjson)['test_id']
            var cardList = $('<div class="column"><div tabindex"' + i +'" id="cardview_' + i + '" class="card" style="font-size: 10px" onClick="showAllTestSet(\'' + testName + '\')"><h6>testID: ' + testName.slice(0,9) + '</h6><h6>madeBy: '+json_obj['user_id']+'</h6><h6>'+json_obj['description']+'</h6><h6>approved: ' + String(testApprove) + '</h6></div></div>')
            cardList.appendTo('#data_panel')
          });
    });
}

function MovePage(url, newurl){
    var urlString = location.href;
    var oldURL = url
    var changeURL = newurl
    if (urlString.match(oldURL)){
        window.location.replace(urlString.replace(oldURL, changeURL));
    }
}

function saveAsFile() {
    console.log(saveAsFile)
    testsets = []
    const element = document.getElementsByClassName('card');
    for (var i = 0; i < element.length ; i++) {
        var v = element.item(i);
        testsets.push({
            'testid': v.onclick.toString().split("'")[1], 
            'userid': v.getElementsByTagName("h6")[1].textContent.split(": ")[1],
            'Description': v.getElementsByTagName("h6")[2].textContent,
        });
    }
    console.log(testsets)
    var testData = 
    {
        'testsets': testsets,
    }
    $.ajax({
        type: 'POST',
        url: '/testset/save',
        data: JSON.stringify(testData),
        dataType: 'json',
        asyn:false,
        contentType: 'application/json; charset=utf-8'
    }).done(function(msg) {
        console.log(msg);
    });
}
