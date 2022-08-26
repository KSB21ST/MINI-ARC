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

task1 = ['Felipe_Centralize_l6aei788udv3m', 
    'Bega_rotating_colors_l6acdi323jol47enccp', 
    'Sheikh_Simple_Occlusion_Corrected_l6aem8yo7dxiyb3i5g4',
    'Jaehyun_define_boundary_l6aeugn2pfna6pvwdt',
    'Sharon_3%22ㄴ%22s_l6bksw4pe',
    'Chaeyoon_Stretch_the_object_ho',
    'Minhyuk_OrangeToYellow_l6aasjv',
    'Jaehyun_reshape_the_top_left_2x2_to_the_bottom_right_2x2_l6ae262gcpe3lw9b2p',
    'Felipe_Fill_the_black_patches_l6bk',
    'Minji_2x2_grid_at_the_bottom-right_indicates_the_rotation_for_the_3x3_grid_on_the_upper-left_l6aajdd8e987ucg7wmp',
    'Jaehyun_flip_to_the_long_side_l6ac65n6z6qn8i2lsw',
    'Chaeyoon_Change_color_of_object_clockwise_l6bk9tti405ajm30vuv',
    'Tony_Good_layer_l69nn5lz6kk4z4szffo',
    'Sheikh_One_Color_Sequence_l6',
    'Jaehyun_Extracting_diagonal_color_l6ab8vmgwv3s18vt7dq',
    'Minji_Flip_color!_l6ab8jog1gzd12',
    'Kien_Bouncing_Ball_l6acvhhkgcb',
    'Sundong_Colony_Expansion_2_l6d2q1yx5npw0qdrnzn',
    'Minhyuk_FloodFill_l6ab6wvu67ltk',
    'Jaehyun_wave_propagation_l6afe4he1mhixwh8v9e',
    'wenchao_flip_based_on_the_line',
    'Sharon_ExpandnContract_l6ab75',
    'Sheikh_One_Color_Gravity_l6bk9t38ni3lwbapno',
    'Chaeyoon_Count_the_number_of',
    'Sheikh_Simple_Box_Moving_l6aapas5si5cuue2txa']
data = []
selected = []
try:
    cur.execute("SELECT * from tasklist")
    data = [dict((cur.description[i][0], value) \
            for i, value in enumerate(row)) for row in cur.fetchall()]
    for idx in range(len(task1)):
        for i in data:
            if(task1[idx] in i['task_name']):
                print(task1[idx])
                i['type'] = 'task1'
                selected.append(i)
except Exception as e:
    print(e)

    