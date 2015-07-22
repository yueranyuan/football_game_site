from flask import Flask
from flask_s3 import FlaskS3
import os

app = Flask(__name__, instance_relative_config=True)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['txt', 'csv'])
app.config.from_object('app.config')
app.config.from_pyfile('config.py')
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, UPLOAD_FOLDER)
app.config['EXPERIMENT_FOLDER'] = os.path.join(app.root_path, 'experiments')

s3 = FlaskS3(app)

from . import views
