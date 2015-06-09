import os
from . import app, ALLOWED_EXTENSIONS
from flask import render_template, request, send_from_directory, send_file
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
