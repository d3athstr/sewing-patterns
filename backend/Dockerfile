FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port Flask runs on
EXPOSE 5000

# Start the Flask application with proper host binding
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
