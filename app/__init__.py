from flask_sqlalchemy import SQLAlchemy
from app.config import Config
from flask import Flask

db = SQLAlchemy()

def create_app():
    app = Flask(__name__, static_folder='static')
    app.config.from_object(Config)
    
    db.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.logs import logs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(logs_bp)

    return app 