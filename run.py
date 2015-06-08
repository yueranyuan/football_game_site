from app import app
import flask_s3

flask_s3.create_all(app)
app.run(host='0.0.0.0', port=8000, debug=True)
