# import os

# path_dir = 'generated'
# file_list = os.listdir(path_dir)
# for i in file_list:
#     list_ = i.split(' ')
#     newname = '_'.join(list_)
#     os.rename('generated/'+i, 'generated/' +newname)

import os
import json
import sqlite3

con = sqlite3.connect('./server/src/instance/flaskr.sqlite')
cur = con.cursor()

base_dir = 'data'
data_class = ['MiniARC']
data = []
selected = []
try:
    cur.execute("SELECT * from tasklist")
    data = [dict((cur.description[i][0], value) \
            for i, value in enumerate(row)) for row in cur.fetchall()]
    for i in data:
        _list = i['task_name'].split('_')
        _task_name = '_'.join(_list[1:])
        _query = '''UPDATE tasklist SET task_name="''' + str(_task_name) + '''" WHERE task_name="''' + str(i['task_name']) + '''"'''
        print(_query)
        cur.execute(_query)
    con.commit()
except Exception as e:
    print(e)

    