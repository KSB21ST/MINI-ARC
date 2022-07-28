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

@app.route('/', methods=['POST', 'GET'])
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
    # with open('json_data/{}_{}.json'.format(json_obj.get('task'), json_obj.get('user_id')), 'w') as f:
    #     json.dump(json_obj, f)
    return render_template('testing_interface.html')

@app.route('/testset')
def show_testset():
    return render_template('testset_interface.html')

@app.route('/testset/<state>')
def show_url_param(state):
    print(state)
    return render_template('testset_interface.html')

@app.route('/testset/submit', methods=['POST', 'GET'])
def store_final_set():
    json_obj = request.json
    try:
        con = db.get_db()
        con.execute(
<<<<<<< HEAD
            "INSERT INTO testsets (user_id, test_id, testjson, approve, ratings, Description) VALUES (?, ?, ?, ?, ?, ?)", (json_obj.get('user_id'), json_obj.get('test_id'), json.dumps(json_obj), False, 0, json_obj.get('description'))
=======
            "INSERT INTO testsets (user_id, test_id, testjson, approve, ratings, Description) VALUES (?, ?, ?, ?, ?, ?)", (json_obj.get('user_id'), json_obj.get('test_id'), json.dumps(json_obj), False, 0, json_obj.get('Description'))
>>>>>>> acd63f4025822e6e36d89768820657790dfd65f3
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

@app.route('/testset/list/admin')
def show_test_list_admin():
    return render_template('testset_list_admin.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='80', debug=False)
    
