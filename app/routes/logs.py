from flask import Blueprint, jsonify, request
from app.models.log import Log
from app import db
from app.utils.decorators import login_required
from datetime import datetime

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/get_logs')
@login_required
def get_logs():
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        logs_list = []
        for log in logs:
            logs_list.append({
                'id': log.id,
                'log_message': log.log_message,
                'log_time': log.log_time.isoformat(),
                'ip_src': log.ip_src,
                'tcp_sport': log.tcp_sport,
                'ip_dst': log.ip_dst,
                'tcp_dport': log.tcp_dport,
                'severity': log.severity
            })
        return jsonify(logs_list)
    except Exception as e:
        print(f"Error in get_logs: {str(e)}")
        return jsonify([])

@logs_bp.route('/delete_log/<int:id>', methods=['DELETE'])
@login_required
def delete_log(id):
    try:
        log = Log.query.get(id)
        if log is None:
            return jsonify({'success': False, 'message': 'Log not found'}), 404

        db.session.delete(log)
        db.session.commit()

        with open('logs.txt', 'a') as f:
            log_entry = f"[{datetime.now()}] LOG DELETED - ID: {id}\n"
            f.write(log_entry)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@logs_bp.route('/test_payload', methods=['POST'])
@login_required
def test_payload():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Invalid JSON'}), 400
            
        data = request.get_json()
        payload = data.get('payload')
        
        if not payload:
            return jsonify({'success': False, 'message': 'Payload is required'}), 400

        # Gunakan fungsi dari idsServer untuk deteksi
        attack_type, severity, detected_payload = detect_attack(payload)
        
        if not attack_type:
            attack_type = "Unknown"
            severity = "LOW"
            detected_payload = payload
        
        log_message = f"{attack_type} Attack Detected! Payload: {detected_payload}"
        
        # Gunakan fungsi dari idsServer untuk logging
        log_attack(log_message, "127.0.0.1", 0, "127.0.0.1", 0, severity)
        
        return jsonify({
            'success': True,
            'attack_type': attack_type,
            'severity': severity
        })
        
    except Exception as e:
        print(f"Error in test_payload: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500 