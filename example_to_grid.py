import json
import os
import numpy as np

base_dir = './'
data_class = 'MiniARC'
types = ['train', 'test']

data_write_loc = 'MiniARC_Obj'

idx = 0
tasks = os.listdir(os.path.join(base_dir, data_class))

read_class = 'MiniARC_Obj'
READ = True

if (READ):
    obj_list = os.listdir(os.path.join(base_dir, read_class))
    for obj in obj_list:
        obj_read = np.load(os.path.join(base_dir, read_class, obj))
        print(obj_read)
    exit()


for task in tasks:
    task_path = os.path.join(base_dir, data_class, task)
    f = open(task_path, 'r')

    json_obj = json.load(f)
    for t in types:
        exList = json_obj[t]
        for ex in exList:
            input = ex['input']
            output = ex['output']

            processed_input = []
            processed_output = []
            
            # replace None with 0 and string with integer
            for r in range(len(input)):
                processed_input.append([])
                for c in range(len(output[0])):
                    elem = input[r][c]
                    if (not elem):
                        processed_input[r].append(0)
                    elif (isinstance(elem, str)):
                        processed_input[r].append(int(elem))
                    else:
                        processed_input[r].append(elem)
            
            for r in range(len(output)):
                processed_output.append([])
                for c in range(len(output[0])):
                    elem = output[r][c]
                    if (not elem):
                        processed_output[r].append(0)
                    elif (isinstance(elem, str)):
                        processed_output[r].append(int(elem))
                    else:
                        processed_output[r].append(elem)

            # print('\n'.join(' '.join(str(x) for x in row) for row in processed_input))
            # print()
            # print('\n'.join(' '.join(str(x) for x in row) for row in processed_output))
            # print()

            f_name = str(idx)
            f_loc = os.path.join(base_dir, data_write_loc, f_name)
            np.save(f_loc, processed_input)
            idx += 1
            f_name = str(idx)
            f_loc = os.path.join(base_dir, data_write_loc, f_name)
            np.save(f_loc, processed_output)
            idx += 1

