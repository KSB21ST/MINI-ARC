
class Grid {
    constructor(height, width, values) {
        this.height = height;
        this.width = width;
        this.grid = new Array(height);
        for (var i = 0; i < height; i++){
            this.grid[i] = new Array(width);
            for (var j = 0; j < width; j++){
                if (values != undefined && values[i] != undefined && values[i][j] != undefined){
                    this.grid[i][j] = values[i][j];
                } else {
                    this.grid[i][j] = 0;
                }
            }
        }
    }
}

class Cell {
    constructor(r, c, value) {
        this.row = r;
        this.col = c;
        this.val = value;
    }

    setRow(r) {
        this.row = r;
    }

    setCol(c) {
        this.col = c;
    }

    setVal(val) {
        this.val = val;
    }
}

class Layer {
    constructor(cells, z, height, width, id) {
        if (typeof cells == undefined) {
            this.cells = new Array();
        } else {
            this.cells = cells.filter(cell => cell.val > 0);
        }
        this.z = z;
        this.height = height;
        this.width = width;
        this.id = id;
    }

    updateCell(cells) {
        this.cells = cells;
    }

    updateGrid(grid) {
        this.cells = new Array();
        for (var r = 0; r < grid.grid.length; r++) {
            for (var c = 0; c < grid.grid[r].length; c++) {
                if (grid.grid[r][c] > 0) {
                    this.cells.push(new Cell(r, c, grid.grid[r][c]));
                }
            }
        }
    }

    containsCell(r, c) {
        for (var i = 0; i < this.cells.length; i++) {
            if (r == this.cells[i].row && c == this.cells[i].col) {
                return true;
            }
        }
        return false;
    }

    addCell(cell) {
        for (var i = 0; i < this.cells.length; i++) {
            if (this.cells[i].row == cell.row && this.cells[i].col == cell.col) {
                this.cells[i].val = cell.val;
                return;
            }
        }
        this.cells.push(cell);
    }

    removeCell(r, c) {
        var oldSize = this.cells.length;
        var newCells = this.cells.filter(cell => cell.row != r && cell.col != c);
        if (newCells.size == oldSize) {
            errorMsg("Cell not included in layer");
        } else {
            this.cells = newCells;
            infoMsg("Cell removed from layer");
        }
    }

    getGrid() {
        if (!this.cells.length) {
            return new Grid(this.height, this.width, undefined);
        }
        var grid = new Array(this.height)

        for (var i = 0; i < this.height; i++){
            grid[i] = new Array(this.width);
            for (var j = 0; j < this.width; j++){
                grid[i][j] = 0;
            }
        }
        for (var i = 0; i < this.cells.length; i++) {
            var cell = this.cells[i]
            if(cell.val != undefined && cell.row < this.height && cell.col < this.width){
                grid[cell.row][cell.col] = cell.val;
            }
            
        }
        return new Grid(this.height, this.width, grid);
    }
}

function floodfillFromLocation(grid, i, j, symbol) {
    i = parseInt(i);
    j = parseInt(j);
    symbol = parseInt(symbol);

    target = grid[i][j];
    
    if (target == symbol) {
        return;
    }

    function flow(i, j, symbol, target, affectedCells) {
        if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
            if (grid[i][j] == target) {
                grid[i][j] = symbol;
                affectedCells.push(new Cell(i, j, symbol));
                affectedCells = affectedCells.concat(
                    flow(i - 1, j, symbol, target, affectedCells), 
                    flow(i + 1, j, symbol, target, affectedCells),
                    flow(i, j - 1, symbol, target, affectedCells),
                    flow(i, j + 1, symbol, target, affectedCells)
                );
            }
        }
        return affectedCells;
    }
    return flow(i, j, symbol, target, new Array());
}

function parseSizeTuple(size) {
    size = size.split('x');
    if (size.length != 2) {
        alert('Grid size should have the format "3x3", "5x7", etc.');
        return;
    }
    if ((size[0] < 1) || (size[1] < 1)) {
        alert('Grid size should be at least 1. Cannot have a grid with no cells.');
        return;
    }
    if ((size[0] > 30) || (size[1] > 30)) {
        alert('Grid size should be at most 30 per side. Pick a smaller size.');
        return;
    }
    return size;
}

function convertSerializedGridToGridObject(values) {
    height = values.length;
    width = values[0].length;
    return new Grid(height, width, values)
}

function fitCellsToContainer(jqGrid, height, width, containerHeight, containerWidth) {
    candidate_height = Math.floor((containerHeight - height) / height);
    candidate_width = Math.floor((containerWidth - width) / width);
    size = Math.min(candidate_height, candidate_width);
    size = Math.min(MAX_CELL_SIZE, size);
    jqGrid.find('.cell').css('height', size + 'px');
    jqGrid.find('.cell').css('width', size + 'px');
}

function fillJqGridWithData(jqGrid, dataGrid) {
    jqGrid.empty();
    height = dataGrid.height;
    width = dataGrid.width;
    for (var i = 0; i < height; i++){
        var row = $(document.createElement('div'));
        row.addClass('row');
        for (var j = 0; j < width; j++){
            var cell = $(document.createElement('div'));
            cell.addClass('cell');
            cell.attr('x', i);
            cell.attr('y', j);
            setCellSymbol(cell, dataGrid.grid[i][j]);
            row.append(cell);
        }
        jqGrid.append(row);
    }
}

function copyJqGridToDataGrid(jqGrid, dataGrid) {
    row_count = jqGrid.find('.row').length
    if (dataGrid.height != row_count) {
        return
    }
    col_count = jqGrid.find('.cell').length / row_count
    if (dataGrid.width != col_count) {
        return
    }
    jqGrid.find('.row').each(function(i, row) {
        $(row).find('.cell').each(function(j, cell) {
            dataGrid.grid[i][j] = parseInt($(cell).attr('symbol'));
        });
    });
}

function setCellSymbol(cell, symbol) {
    cell.attr('symbol', symbol);
    classesToRemove = ''
    for (i = 0; i < 10; i++) {
        classesToRemove += 'symbol_' + i + ' ';
    }
    cell.removeClass(classesToRemove);
    cell.addClass('symbol_' + symbol);
}

function errorMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    $('#error_display').hide();
    $('#info_display').hide();
    $('#error_display').html(msg);
    $('#error_display').show();
    $('#error_display').fadeOut(5000);
}

function infoMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    $('#info_display').hide();
    $('#error_display').hide();
    $('#info_display').html(msg);
    $('#info_display').show();
    $('#info_display').fadeOut(5000);
}
