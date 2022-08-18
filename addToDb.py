import os
import json
import sqlite3

con = sqlite3.connect('./server/src/instance/flaskr.sqlite')
cur = con.cursor()

base_dir = 'data'
data_class = ['MiniARC']
add = False
# data_class = ['selected_examples', 'training', 'evaluation']

if (not add):
    cur.execute("DELETE FROM tasklist")

for type in data_class:
    tasks = os.listdir(os.path.join(base_dir, type))
    for task in tasks:
        task_path = os.path.join(base_dir, type, task)
        f = open(task_path, 'r')
        # print(task.split('.')[0], f.read())
        
        cur.execute(
            "INSERT INTO tasklist (task_name, content, type) VALUES (?, ?, ?)", (task.replace('\n', '_').replace(' ', '_').split('.')[0], f.read(), type)
        )
con.commit()


if (not add):
    cur.execute("DELETE FROM logs")

for log in os.listdir(os.path.join(base_dir, 'Logs')):
    log_path = os.path.join(base_dir, 'Logs', log)
    f = open(log_path, 'r')
    content = json.load(f)
    cur.execute(
        "INSERT INTO logs (task_id, user_id, action_sequence) VALUES (?, ?, ?)", (content['task'], content['user_id'], json.dumps(content))
    )
con.commit()
