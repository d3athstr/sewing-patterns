# Sewing Patterns Backend Security Improvements

This directory contains security improvements for the Sewing Patterns application backend.

## Security Improvements Implemented

1. **Environment Variable Configuration**
   - Removed hardcoded credentials
   - Added .env.example template
   - Created config.py for centralized configuration

2. **Authentication System**
   - JWT-based authentication
   - User registration and login
   - Role-based access control

3. **Input Validation**
   - Marshmallow schemas for all API endpoints
   - Validation for query parameters
   - Proper error handling for validation failures

4. **Secure Database Access**
   - User ownership of patterns
   - Permission checks for all operations
   - Secure binary data handling

5. **Error Handling**
   - Global error handler
   - Specific error handlers for common cases
   - Consistent error response format

## Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a .env file based on .env.example:
   ```
   cp .env.example .env
   ```

4. Edit the .env file with your actual credentials

5. Run the application:
   ```
   python app.py
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Patterns
- `GET /api/patterns` - Get all patterns (with optional filtering)
- `POST /api/patterns` - Add a new pattern (requires authentication)
- `GET /api/patterns/<id>` - Get a specific pattern
- `PUT /api/patterns/<id>` - Update a pattern (requires authentication)
- `DELETE /api/patterns/<id>` - Delete a pattern (requires authentication)
- `GET /api/patterns/<id>/image` - Get pattern image

### PDFs
- `GET /api/pdfs` - Get all PDFs
- `GET /api/pdfs/<id>` - Get a specific PDF
- `POST /api/patterns/<id>/pdfs` - Add a PDF to a pattern (requires authentication)
- `DELETE /api/pdfs/<id>` - Delete a PDF (requires authentication)

### Scraper
- `GET /api/scrape?brand=<brand>&pattern_number=<number>` - Scrape and add pattern (requires authentication)
