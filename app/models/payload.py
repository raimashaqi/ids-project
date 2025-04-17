from app import db

class Payload(db.Model):
    __tablename__ = 'payload'
    
    id = db.Column(db.Integer, primary_key=True)
    nama_payload = db.Column(db.String(255), nullable=False)
    jumlah_baris = db.Column(db.Integer, nullable=False)
    id_log = db.Column(db.Integer, db.ForeignKey('logs.id'), nullable=False)  # foreign key to logs
    
    log = db.relationship('Log', backref=db.backref('payloads', lazy=True))  # Relationship to the Log model
