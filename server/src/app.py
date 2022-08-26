import os
from flask import *
import db
import json
import sqlite3 as sql

# create and configure the app
app = Flask(__name__)
app.config.from_mapping(
#    SECRET_KEY='52acfd60b764849879dcea66fd0cecfac42547f742128204c1b5dcceffe1773a',
    DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
)
db.init_app(app)

@app.route('/')
def show():
    return render_template('testing_interface.html')

@app.route('/logs')
def show_logs():
    return render_template("log_interface.html")

@app.route('/log_db')
def getLogs():
    logs = []
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from logs")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/tasklist', methods=['GET'])
# def getTaskList():
#     data = []
#     try:
#         cur = db.get_db().cursor()
#         cur.execute("SELECT * from tasklist")
#         data = [dict((cur.description[i][0], value) \
#                for i, value in enumerate(row)) for row in cur.fetchall()]
#     except Exception as e:
#         print(e)
#     return jsonify(data)

def getTaskList():
    test_task = ['wenchao_diagonal_flip_l6abdiipodvgey6tbdf']
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
    task2 = ['Sheikh_One_Color_Multiply_by_two_l6bkmzmkvfs83xelwq8',
    'Sheikh_Simple_Color_Switch_l6ab',
    'Chaeyoon_Put_away_overlapping_rectangles_l6afs0vwh2o0ztvftrs',
    'anar_count_green_and_color_red__l6ae4occ03osbzmznmgi',
    'Sheikh_Filling_Corner_Corrected_l6bhlma1gimq40v7dyb',
    'Bega_Reflection_l6ab2g1dkofxrxht5h',
    'Jaehyun_clockwise_rotation_l6acrhm6kqqbr4w69i8',
    'Hyunkyu_Change_the_location_l6',
    'Jaehyun_find_single_cells_l6afg6g',
    'wenchao_complete_square_l6bk',
    'Sheikh_One_Color_Simple_Stuff_l6bkg9unb1kgovxkon6',
    'Jaehyun_parting_cross_l6acqil00ywf88hqnrpm',
    'Hyunkyu_Razer_reflection_l6afnlpp4vzn49nkx93',
    'Minhyuk_AscendingOrder_l6abjqzwwo7mhobq52',
    'Jaehyun_inter_and_outer_blue_sq',
    'Minji_Tiling_l6aed6qtpdz0r7firb',
    'Jaehyun_stretch_vertically_l6acwq',
    'Jaehyun_filling_in_the_3x3_square',
    'Minji_Tetris__l6ab7fu64lvutswrt',
    'Felipe_Expansion_and_Interpolation_l6acqdnnv8tlnxpx19',
    'wenchao_diagonal_flip_l6abdiipo',
    'Chaeyoon_Fit_the_object_to_the_gray_area_l6ael6as2vofatntvzb',
    'Eunji_orange_vs_blue_l6abmp2nf',
    'Bega_going_up_l6acmlt1nkjxwh6',
    'Jaehyun_connect_the_dots_to_']
    data = []
    selected = []
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from tasklist")
        data = [dict((cur.description[i][0], value) \
                for i, value in enumerate(row)) for row in cur.fetchall()]
        for idx in range(len(task1)):
            for i in data:
                if(task1[idx] in i['task_name']):
                    i['type'] = 'task1'
                    i['task_name'] = str(idx) + "_" + i['task_name']
                    selected.append(i)
        
        for idx in range(len(task2)):
            for i in data:
                if(task2[idx] in i['task_name']):
                    i['type'] = 'task2'
                    i['task_name'] = str(idx) + "_" + i['task_name']
                    selected.append(i)
        selected.append(data[0])
    except Exception as e:
        print(e)
    return jsonify(selected)

@app.route('/tasklist/<taskname>', methods=['GET'])
def getTask(taskname):
    return

@app.route('/', methods=['POST'])
def store_log():
    json_obj = request.json
    try:
        con = db.get_db()
        con.execute(
            "INSERT INTO logs (task_id, user_id, action_sequence) VALUES (?, ?, ?)", (json_obj.get('task').split('.')[0], json_obj.get('user_id'), json.dumps(json_obj))
        )
        con.commit()
    except:
        print("An error has occurred while inserting new data.")
    
    # Save to File
    file_name = "-".join([json_obj.get('task').split('.')[0], json_obj.get('user_id')]) + ".json"
    with open(os.path.join("../../data/event_Logs", file_name), "w") as f:
        f.write(json.dumps(json_obj))

    return render_template('testing_interface.html')

@app.route('/testset')
def show_testset():
    return render_template('testset_interface.html')

@app.route('/testset/<state>')
def show_url_param(state):
    return render_template('testset_interface.html', id=state)

@app.route('/testset/submit', methods=['POST', 'GET'])
def store_final_set():
    json_obj = request.json
    try:
        con = db.get_db()
        con.execute(
            "INSERT INTO testsets (user_id, test_id, testjson, approve, ratings, Description) VALUES (?, ?, ?, ?, ?, ?)", (json_obj.get('user_id'), json_obj.get('test_id'), json.dumps(json_obj), False, 0, json_obj.get('description'))
        )
        con.commit()
    except Exception as e:
        print(e)
    return render_template('testset_interface.html')

@app.route('/testset/submit_approval', methods=['POST', 'GET'])
def update_approval():
    print("submit_approval")
    json_obj = request.json
    try:
        con = db.get_db()
        _query = "UPDATE testsets SET approve=" + str(json_obj.get('approve')) + " WHERE test_id='" + json_obj.get('test_id') + "'"
        print(_query)
        con.execute(_query)
        con.commit()
    except Exception as e:
        print(e)
    return render_template('testset_list_admin.html')

@app.route('/testset/delete', methods=['POST', 'GET'])
def delete_set():
    print("submit_approval")
    json_obj = request.json
    try:
        con = db.get_db()
        _query = "DELETE FROM testsets WHERE test_id='" + json_obj.get('test_id') + "'"
        print(_query)
        con.execute(_query)
        con.commit()
    except Exception as e:
        print(e)
    return render_template('testset_list_admin.html')

@app.route('/testset/list')
def show_test_list():
    return render_template('testset_list.html')

@app.route('/testset/getlist', methods=['POST', 'GET'])
def get_test_list():
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from testsets")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/testset/get_approved_list', methods=['POST', 'GET'])
def get_approved_test_list():
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from testsets WHERE approve=1")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/testset/get_disapproved_list', methods=['POST', 'GET'])
def get_disapproved_test_list():
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from testsets WHERE approve=0")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/testset/queryone', methods=['POST', 'GET'])
def get_test_one():
    json_idx = request.args.get('index')
    # query_ = "SELECT * from testsets limit 1 offset " + json_idx
    query_ = "SELECT * from testsets WHERE test_id='" + json_idx + "'"
    try:
        cur = db.get_db().cursor()
        cur.execute(query_)
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/testset/admin')
def show_test_list_admin():
    return render_template('testset_list_admin.html')

@app.route('/testset/search', methods=['POST', 'GET'])
def search_test():
    _user_id = request.args['user_id']
    _description = request.args['description']
    _approval = request.args['approval']
    print("search_testset", _user_id, _description, _approval)
    query_ = ""
    if(_user_id):
        if(_description):
            query_ = "SELECT * from testsets WHERE user_id='" + _user_id + "' AND description='"+_description+"'"
        else:
            query_ = "SELECT * from testsets WHERE user_id='" + _user_id + "'"
    else:
        if(_description):
            query_ = "SELECT * from testsets WHERE description='"+_description+"'"
        else:
            query_ = "SELECT * from testsets"
    if(int(_approval) > -1):
        if(_user_id or _description):
            query_ = query_ + " AND approve=" + _approval
        else:
            query_ = query_ + " WHERE approve=" + _approval
    print("search: ", query_)
    try:
        cur = db.get_db().cursor()
        cur.execute(query_)
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/testset/approved')
def show_approved_testset():
    return render_template('testset_approved_list.html')

@app.route('/testset/save', methods=['POST', 'GET'])
def save_json_test():
    _list = request.json['testsets']
    for d in _list:
        query_ = "SELECT * from testsets WHERE test_id='" + d['testid'] + "' AND user_id='"+ d['userid'] + "' AND approve=1"
        try:
            cur = db.get_db().cursor()
            cur.execute(query_)
            data = [dict((cur.description[i][0], value) \
                for i, value in enumerate(row)) for row in cur.fetchall()]
            json_obj = json.loads(data[0]['testjson'])
            testpairs = json.loads(json_obj['testArray'])
            final_set = dict()
            final_set['train'] = []
            final_set['test'] = []
            testpairs[-1]['input'] = testpairs[-1].pop('input_cells')
            testpairs[-1]['output'] = testpairs[-1].pop('output_cells')
            final_set['test'].append(testpairs[-1])
            for i in range(len(testpairs)-1):
                v = testpairs[i]
                v['input'] = v.pop('input_cells')
                v['output'] = v.pop('output_cells')
                final_set['train'].append(v)
            with open('../../data/generated/{}_{}_{}.json'.format(d.get('userid'), d.get('Description'), d.get('testid')), 'w') as f:
                json.dump(final_set, f)
        except Exception as e:
            print(e)
    return jsonify('data')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='80', debug=False)
    
