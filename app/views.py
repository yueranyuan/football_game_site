import os
from . import app, ALLOWED_EXTENSIONS
from flask import (render_template, request, send_from_directory, send_file,
        jsonify, redirect, url_for)
from werkzeug import secure_filename

@app.before_first_request
def initialize():
    if not os.path.isdir(app.config["UPLOAD_FOLDER"]):
        os.mkdir(app.config["UPLOAD_FOLDER"])

@app.route('/')
def home():
    return render_template('index.html', game_path='bin/')

def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/upload/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_data = file.read()
            with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), "a") as file_handle:
                file_handle.write(file_data)
            return "success"

    return render_template('upload.html')

@app.route('/api/update', methods=['POST'])
def update_file():
    fname = secure_filename(request.form.get('name'))
    with open(os.path.join(app.config['UPLOAD_FOLDER'], fname), 'a') as f:
        f.write(request.form.get('data'))
    return "success"

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/')
def uploads():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    files = sorted(files)
    return render_template("uploads.html", uploaded_files=files)

@app.route('/crossdomain.xml')
def unity_crossdomain():
    return send_file("files/crossdomain.xml")

@app.route('/experiment')
def experiment():
    experiment_file = request.args.get('filename')
    if experiment_file is None:
        return "no experiment file specified"

    userid = request.args.get("userid", "unspecified_subject")

    server_globals = {
        'filename': request.args.get('filename'),
        'userid': userid}
    return render_template('experiment.html', server_globals=server_globals)

@app.route('/setup')
def setup_experiment():
    return render_template('experiment_base.html', react="experiment_base.js", css="experiment_base.css")

@app.route('/upload_experiment', methods=['POST'])
def upload_experiment():
    file = request.files['file']
    filename = secure_filename(file.filename)
    file_data = file.read()
    fpath = os.path.join(app.config['EXPERIMENT_FOLDER'], filename)
    with open(fpath, "w") as f:
        f.write(file_data)
    return redirect(url_for('setup_experiment'))

@app.route('/experiment_data/list')
def experiment_data():
    experiment_names = os.listdir(app.config['EXPERIMENT_FOLDER'])
    experiments = [{"name": v} for v in experiment_names]
    return jsonify(experiments=experiments)

def parse_csv(f, delimiter=','):
    import csv
    reader = csv.reader(f, delimiter=delimiter)
    header = reader.next()
    data = []
    for row in reader:
        _data = {header[i]: val for i, val in enumerate(row) if len(val) > 0}
        data.append(_data)
    return data

@app.route('/experiment_data/single')
def experiment_data_single():
    filename = request.args.get('filename')
    with open(os.path.join(app.config["EXPERIMENT_FOLDER"], filename)) as f:
        return jsonify(data=parse_csv(f))
    return "failure"
