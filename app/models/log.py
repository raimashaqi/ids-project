from app import db

class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    log_message = db.Column(db.Text, nullable=False)
    # payload = db.Column(db.Text, nullable=False)
    log_time = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    ip_src = db.Column(db.String(45))
    tcp_sport = db.Column(db.Integer)
    ip_dst = db.Column(db.String(45))
    tcp_dport = db.Column(db.Integer)
    severity = db.Column(db.String(10))
    # location = db.Column(db.String(100)) 