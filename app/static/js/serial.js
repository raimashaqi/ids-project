document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const serialModal = new bootstrap.Modal('#serialModal');
    const generateSerialBtn = document.getElementById('generateSerialBtn');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const serialDisplay = document.getElementById('serialNumber');
    const purchaseCodeInput = document.getElementById('purchaseCode');
    const beliBtn = document.getElementById('beliBtn');

    // Event Listeners
    generateSerialBtn?.addEventListener('click', () => serialModal.show());
    
    generateBtn?.addEventListener('click', () => {
        serialDisplay.textContent = generateSerial();
    });

    copyBtn?.addEventListener('click', copySerial);

    // Serial Modal Hidden Event
    document.getElementById('serialModal')?.addEventListener('hidden.bs.modal', () => {
        const serial = serialDisplay.textContent;
        if (serial && !serial.includes('Click GENERATE')) {
            purchaseCodeInput.value = serial;
            validateSerial(serial);
        }
    });

    // Beli Button Click
    beliBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        const serial = purchaseCodeInput.value.trim();
        
        if (!serial) {
            showAlert('Harap masukkan nomor seri', 'error');
            return;
        }
        
        if (validateSerial(serial)) {
            activateFeatures();
            showAlert('Nomor seri diterima! Semua fitur sekarang aktif.', 'success');
        } else {
            showAlert('Nomor seri tidak valid. Harap generate nomor seri yang valid.', 'error');
        }
    });

    // Initial Check
    checkActivationStatus();

    // Helper Functions
    function generateSerial() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({length: 16}, (_, i) => 
            i > 0 && i % 4 === 0 ? '-' + chars[Math.floor(Math.random() * chars.length)] : 
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    }

    function copySerial() {
        const serial = serialDisplay.textContent;
        if (!serial || serial.includes('Click GENERATE')) return;
        
        navigator.clipboard.writeText(serial)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check me-2"></i> TERSALIN!';
                setTimeout(() => copyBtn.innerHTML = originalText, 2000);
            })
            .catch(console.error);
    }

    function validateSerial(serial) {
        const isValid = /^[A-Z0-9]{4}-?[A-Z0-9]{4}-?[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(serial);
        localStorage.setItem('hasValidSerial', isValid);
        return isValid;
    }

    function activateFeatures() {
        localStorage.setItem('featuresActivated', 'true');
        document.querySelectorAll('.protected-content').forEach(el => {
            el.classList.remove('disabled');
        });
        enableInteractiveElements();
    }

    function checkActivationStatus() {
        if (localStorage.getItem('featuresActivated') === 'true') {
            activateFeatures();
        } else if (purchaseCodeInput?.value) {
            validateSerial(purchaseCodeInput.value);
        } else {
            disableFeatures();
        }
    }

    function enableInteractiveElements() {
        document.querySelectorAll(`
            .protected-content input,
            .protected-content button,
            .protected-content select,
            .protected-content .btn-link,
            .protected-content .import,
            .protected-content .date,
            .protected-content .download
        `).forEach(el => {
            el.disabled = false;
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
        });
    }

    function disableFeatures() {
        document.querySelectorAll('.protected-content').forEach(el => {
            if (!el.classList.contains('disabled')) {
                el.classList.add('disabled');
            }
        });
    }

    function showAlert(message, type) {
        // Implement your preferred alert/notification system
        alert(message); // Replace with toast/sweet alert
    }
});