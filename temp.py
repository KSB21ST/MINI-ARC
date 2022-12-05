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
    print(len(data))
except Exception as e:
    print(e)

    