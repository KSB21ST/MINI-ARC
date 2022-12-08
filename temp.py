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

try:
    _query = "DROP TABLE logs"
    cur.execute(_query)
    con.commit()
except Exception as e:
    print(e)
    