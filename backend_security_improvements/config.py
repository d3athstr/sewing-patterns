"""
Configuration management for the Sewing Patterns application.
Loads environment variables and provides configuration classes.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class with common settings."""
    # Flask configuration
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-key-not-secure')
    DEBUG = False
    TESTING = False
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"postgresql://{os.environ.get('DB_USER', 'user')}:"
        f"{os.environ.get('DB_PASSWORD', 'password')}@"
        f"{os.environ.get('DB_HOST', 'sewing_patterns_db')}:"
        f"{os.environ.get('DB_PORT', '5432')}/"
        f"{os.environ.get('DB_NAME', 'sewing_patterns')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-key-not-secure')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
    
    # API configuration
    API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5000')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    # Use in-memory SQLite for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    

class ProductionConfig(Config):
    """Production configuration."""
    # Ensure all required environment variables are set in production
    @classmethod
    def init_app(cls, app):
        # Check for required environment variables
        required_vars = [
            'FLASK_SECRET_KEY', 
            'JWT_SECRET_KEY', 
            'DB_USER', 
            'DB_PASSWORD'
        ]
        
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        if missing_vars:
            raise RuntimeError(
                f"Missing required environment variables for production: {', '.join(missing_vars)}"
            )


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Get configuration based on environment
def get_config():
    """Return the appropriate configuration object based on the environment."""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
