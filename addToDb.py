import os
import json
import sqlite3

con = sqlite3.connect('./server/src/instance/flaskr.sqlite')
cur = con.cursor()

base_dir = 'data'
data_class = ['selected_examples', 'training', 'evaluation']

for type in data_class:
    tasks = os.listdir(os.path.join(base_dir, type))
    for task in tasks:
        task_path = os.path.join(base_dir, type, task)
        f = open(task_path, 'r')
        # print(task.split('.')[0], f.read())

        
        cur.execute(
            "INSERT INTO tasklist (task_name, content, type) VALUES (?, ?, ?)", (task.split('.')[0], f.read(), type)
        )
        con.commit()
