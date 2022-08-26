import json
import os
import sqlite3

con = sqlite3.connect('../server/src/instance/flaskr.sqlite')
cur = con.cursor()

base_dir = './'
data_write_loc = 'MiniARC_Logs'

cur.execute("SELECT * FROM logs")
rows = cur.fetchall()

for row in rows:
    desc = row[3]
    json_obj = json.loads(desc)
    action_sequence = json_obj['action_sequence']
    for i, action in enumerate(action_sequence):
        grid = action['grid']
        processed_grid = []

        # replace None with 0 and string with integer
        for r in range(len(grid)):
            processed_grid.append([])
            for c in range(len(grid[0])):
                elem = grid[r][c]
                if (not elem):
                    processed_grid[r].append(0)
                elif (isinstance(elem, str)):
                    processed_grid[r].append(int(elem))
                else:
                    processed_grid[r].append(elem)
        json_obj['action_sequence'][i]['grid'] = processed_grid

    
    file_name = "-".join([json_obj["task"], json_obj["user_id"]]) + ".json"
    
    with open(os.path.join(base_dir, data_write_loc, file_name), "w") as f:
        f.write(json.dumps(json_obj))