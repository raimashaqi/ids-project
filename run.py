import logging
from app import create_app, db

# Setup logging
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = create_app()

if __name__ == '__main__':
    try:
        logger.info("Starting application setup...")
        with app.app_context():
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully")
        
        logger.info(f"Starting Flask application on port {app.config['PORT']}")
        app.run(debug=True, port=app.config['PORT'])
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}", exc_info=True) 