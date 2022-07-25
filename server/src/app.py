import os
from flask import Flask, render_template, request
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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port='80', debug=False)
    