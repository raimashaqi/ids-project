from app.config import Config
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from flask_login import LoginManager
from flask_cors import CORS

db = SQLAlchemy()
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    from app.models.user import User
    return User.query.get(int(user_id))

def create_app():
    app = Flask(__name__, static_folder='static')
    app.config.from_object(Config)
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.logs import logs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(logs_bp)

    # ✅ CORS FIX DENGAN credentials dan asal yang diizinkan
    # CORS(app, supports_credentials=True, resources={
    #     r"/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]}
    # })
    
    CORS(app, 
    supports_credentials=True, 
    resources={
        r"/*": {
                "origins": "*",                   # Allow all origins
                "methods": "*",                   # Allow all methods (GET, POST, etc.)
                "allow_headers": "*",             # Allow all headers
                "expose_headers": "*",            # Expose all headers
                "max_age": 86400                  # Cache preflight requests for 24 hours
            }
        }
    )

    return app
