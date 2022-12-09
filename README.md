# Mini-ARC
Subin Kim, Prin Phunyaphibarn, Donghyun Ahn, Sundong Kim<br/>
Published in Neuro Causal and Symbolic AI Workshop @ the 36th Neural Information Processing Systems (NeurIPS) Conference

A link to our paper can be found here:
[Playgrounds for Abstraction and Reasoning](https://openreview.net/forum?id=F4RNpByoqP), 
[poster](https://neurips.cc/media/PosterPDFs/NeurIPS%202022/57706.png?t=1669741859.5469003)
<br/>
Please check the live interface [HERE](http://ksb21st.pythonanywhere.com/).

# Manual Instructions

Get dependencies:
~~~
$ pip3 install flask
~~~

Initialize DB:
~~~
$ cd server/src
$ flask init-db
Initialized the database.
~~~

Start the interface:
~~~
$ cd server/src
$ python3 app.py
~~~

Mini-ARC : Please check the '[./data/MiniARC](https://github.com/KSB21ST/MINI-ARC/tree/master/data/MiniARC)' folder <br/>
sample Mini-ARC trace : Please check the '[./data/MiniARC_traces](https://github.com/KSB21ST/MINI-ARC/tree/master/data/MiniARC_traces)' folder. These are sample traces of the Mini-ARC problem <i>diagonal_flip_l6abdiipodvgey6tbdf</i>. <br/>
Test generation interface: http://localhost/testset <br/>
administrator interface: http://localhost/testset/admin

# O2ARC (Object-Oriented ARC)

A modified ARC task interface which includes new actions and primitives:

### Grid controls

- Resize: input a grid size (e.g. "10x20" or "4x4") and click "Resize". This preserves existing grid content (in the top left corner).
- Copy from input: copy the input grid to the output grid. This is useful for tasks where the output consists of some modification of the input.
- Reset grid: fill the grid with 0s.
- Clear Selection: unselect the selected areas

### Symbol controls

- Edit: select a color (symbol) from the color picking bar, then click on a cell to set its color.
- Select: click and drag on either the output grid or the input grid to select cells.
    - After selecting cells on the output grid, you can select a color from the color picking to set the color of the selected cells. This is useful to draw solid rectangles or lines.
    - After selecting cells on either the input grid or the output grid, you can press C to copy their content. After copying, you can select a cell on the output grid and press "V" to paste the copied content. You should select the cell in the top left corner of the zone you want to paste into.
- Floodfill: click on a cell from the output grid to color all connected cells to the selected color. "Connected cells" are contiguous cells with the same color.

### Layer Controls
- Add Layer: add a new layer. The new layer is automatically selected
- Create Layer from Selection: the selected cells is saved on a new layer
- Delete Layer: To be implemented (Current version is buggy)
- Selecting a layer will bring that layer to the "top"
- Selecting a layer will also select all colored cells in that layer

### Keyboard Controls
- W,A,S,D: move the selected (colored) cells
- X, Y: After copying, paste the reflection of the copied cells across the X/Y axis, with the starting cell being the selected cell in the edition grid.

### Answer validation

When your output grid is ready, click the green "Submit!" button to check your answer. We do not enforce the 3-trials rule.

After you've obtained the correct answer for the current test input grid, you can switch to the next test input grid for the task using the "Next test input" button (if there is any available; most tasks only have one test input).

When you're done with a task, use the "load task" button to open a new task.


## Task file format

The `data` directory contains two subdirectories:

- `data/training`: contains the task files for training (400 tasks). Use these to prototype your algorithm or to train your algorithm to acquire ARC-relevant cognitive priors.
- `data/evaluation`: contains the task files for evaluation (400 tasks). Use these to evaluate your final algorithm. To ensure fair evaluation results, do not leak information from the evaluation set into your algorithm (e.g. by looking at the evaluation tasks yourself during development, or by repeatedly modifying an algorithm while using its evaluation score as feedback).

The tasks are stored in JSON format. Each task JSON file contains a dictionary with two fields:

- `"train"`: demonstration input/output pairs. It is a list of "pairs" (typically 3 pairs).
- `"test"`: test input/output pairs. It is a list of "pairs" (typically 1 pair).

A "pair" is a dictionary with two fields:

- `"input"`: the input "grid" for the pair.
- `"output"`: the output "grid" for the pair.

A "grid" is a rectangular matrix (list of lists) of integers between 0 and 9 (inclusive). The smallest possible grid size is 1x1 and the largest is 30x30.

When looking at a task, a test-taker has access to inputs & outputs of the demonstration pairs, plus the input(s) of the test pair(s). The goal is to construct the output grid(s) corresponding to the test input grid(s), using 3 trials for each test input. "Constructing the output grid" involves picking the height and width of the output grid, then filling each cell in the grid with a symbol (integer between 0 and 9, which are visualized as colors). Only *exact* solutions (all cells match the expected answer) can be said to be correct.


## Usage of the testing interface

The testing interface is located at `apps/testing_interface.html`. Open it in a web browser (Chrome recommended). It will prompt you to select a task JSON file.

After loading a task, you will enter the test space, which looks like this:

![test space](https://arc-benchmark.s3.amazonaws.com/figs/arc_test_space.png)

On the left, you will see the input/output pairs demonstrating the nature of the task. In the middle, you will see the current test input grid. On the right, you will see the controls you can use to construct the corresponding output grid.
