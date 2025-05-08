/**
 * IDS Detector - Script Monitoring Keamanan (Simplified)
 */

(function () {
  // Konfigurasi dasar
  const config = {
    apiUrl: 'http://localhost:1337/test_payload',
    debug: false,
    checkOnSubmit: true   // Periksa saat form disubmit
  };

  // Selector untuk elemen yang dipantau
  const targetSelectors = 'input[type="text"], input[type="search"], textarea, [contenteditable="true"]';
  
  // Logger sederhana
  const log = function(message, type = 'info') {
    if (config.debug) {
      console[type](`[IDS] ${message}`);
    }
  };

  // Deteksi payload berbahaya (Fungsi API yang disederhanakan)
  const detectPayload = async function(payload) {
    if (!payload || payload.trim() === '') return null;
    
    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ payload })
      });
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      return await response.json();
    } catch (err) {
      log(`Error: ${err.message}`, 'error');
      return { success: false, message: err.message };
    }
  };

  // Handler untuk submit form
  const handleFormSubmit = async function(e) {
    const form = e.target;
    
    if (config.checkOnSubmit) {
      e.preventDefault();
      
      // Gabungkan semua nilai input menjadi satu string
      const inputs = form.querySelectorAll(targetSelectors);
      let combinedValue = '';
      
      inputs.forEach(input => {
        const value = input.value || input.innerText || '';
        if (value.trim().length > 0) {
          combinedValue += value + ' ';
        }
      });
      
      // Periksa payload gabungan
      if (combinedValue.trim().length > 0) {
        const result = await detectPayload(combinedValue);
        // Submit form regardless of detection result
        form.submit();
      } else {
        // Submit form jika tidak ada input
        form.submit();
      }
    }
  };

  // Inisialisasi
  const initialize = function() {
    log('Initializing IDS Detector');
    
    // Listener untuk form submit
    if (config.checkOnSubmit) {
      document.addEventListener('submit', handleFormSubmit, true);
    }
    
    // Publik API
    window.IDSProtector = {
      detectPayload,
      version: 'simple-1.0'
    };
    
    log('IDS Detector initialized');
  };

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();