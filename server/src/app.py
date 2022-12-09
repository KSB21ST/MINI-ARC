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
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from logs")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/tasklist', methods=['GET'])
def getTaskList():
    data = []
    try:
        cur = db.get_db().cursor()
        cur.execute("SELECT * from tasklist")
        data = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    except Exception as e:
        print(e)
    return jsonify(data)

@app.route('/tasklist/<taskname>', methods=['GET'])
def getTask(taskname):
    return

@app.route('/', methods=['POST'])
def store_log():
    # store logs
    return

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
    
