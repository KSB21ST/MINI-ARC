import os
import json
import sqlite3

data_dir = 'data/evaluation/'
tasks = os.listdir(data_dir)
for task in tasks:
    task_path = os.path.join(data_dir, task)
    f = open(task_path, 'r')
    # print(task.split('.')[0], f.read())

    con = sqlite3.connect('./server/src/instance/flaskr.sqlite')
    cur = con.cursor()
    cur.execute(
        "INSERT INTO tasklist (task_name, content) VALUES (?, ?)", (task.split('.')[
            0], f.read())
    )
    con.commit()
