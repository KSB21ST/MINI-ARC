import os

path_dir = 'generated'
file_list = os.listdir(path_dir)
for i in file_list:
    list_ = i.split(' ')
    newname = '_'.join(list_)
    os.rename('generated/'+i, 'generated/' +newname)
    