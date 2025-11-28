from flask import Flask, jsonify
import os
import redis
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
DATABASE_URL = os.getenv("DATABASE_URL")

r = redis.from_url(REDIS_URL, decode_responses=True)

@app.route("/health")
def health():
    ok = {"redis": False, "db": False}
    try:
        if r.ping():
            ok["redis"] = True
    except Exception:
        ok["redis"] = False

    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        cur.execute("SELECT 1 AS ok")
        cur.close()
        conn.close()
        ok["db"] = True
    except Exception:
        ok["db"] = False

    status = 200 if all(ok.values()) else 500
    return jsonify(ok), status

@app.route("/")
def index():
    return "Hello from Docker Compose app!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
