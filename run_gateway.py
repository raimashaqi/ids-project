import os
from app.gateway import APIGateway
import logging
from datetime import datetime

def setup_logging():
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Configure logging with simple format
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/gateway.log'),
            logging.StreamHandler()  # Log to console
        ]
    )

    # Log startup message
    logging.info("=== Gateway Service Started ===")
    logging.info("Frontend URL: http://localhost:3000")
    logging.info("Backend URL: http://localhost:5000")
    logging.info("Gateway URL: http://localhost:1337")
    logging.info("Test endpoint available at: http://localhost:1337/testing")

def main():
    
    # Setup logging
    setup_logging()
    # Initialize and run the gateway
    gateway = APIGateway('http://localhost:5000')
    
    # Log startup
    logging.info("Starting IDS Gateway")
    print("IDS Gateway is running and protecting admin login")
    print("Press Ctrl+C to stop")
    
    try:
        gateway.run(host='0.0.0.0', port=1337)
    except KeyboardInterrupt:
        logging.info("Gateway stopped by user")
        print("\nGateway stopped")
    except Exception as e:
        logging.error(f"Gateway error: {str(e)}")
        print(f"Error: {str(e)}")

if __name__ == '__main__':
    main() 