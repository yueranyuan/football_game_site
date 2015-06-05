import os
from . import app, UPLOAD_FOLDER, ALLOWED_EXTENSIONS
from flask import render_template, request, url_for, redirect, send_from_directory
from werkzeug import secure_filename

@app.route('/')
def home():
    return render_template('index.html', game_path='')

def allowed_file(filename):
    print(filename)
    print(filename.rsplit('.', 1)[1])
    print(ALLOWED_EXTENSIONS)
    return '.' in filename and \
            filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/upload/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        print("asfdasdf")
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for("uploads"))

    return render_template('upload.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/')
def uploads():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template("uploads.html", uploaded_files=files)

