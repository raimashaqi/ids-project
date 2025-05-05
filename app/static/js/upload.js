// File Upload Functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Upload script loaded');
  
  // Initialize UI components
  setupFileUpload();
  setupPayloadModal();
  setupActivationFeatures();
  setupNotifications();
  setupClock();
});

// File Upload Functionality
function setupFileUpload() {
  console.log('Setting up file upload');
  
  const uploadArea = document.querySelector('.upload-area');
  const fileInput = document.getElementById('fileInput');
  const submitButton = document.getElementById('submitUpload');
  const browseBtn = document.querySelector('.browse-btn');
  const importBtn = document.querySelector('.import');
  const importModal = document.getElementById('importModal');
  const closeModal = document.querySelector('.close-modal');

  console.log('Elements found:', {
    uploadArea: !!uploadArea,
    fileInput: !!fileInput,
    submitButton: !!submitButton,
    browseBtn: !!browseBtn,
    importBtn: !!importBtn,
    importModal: !!importModal
  });

  if (!uploadArea || !fileInput || !submitButton || !browseBtn || !importBtn || !importModal) {
    console.error('Required elements not found');
    return;
  }

  // Initialize submit button as disabled
  submitButton.disabled = true;

  // Handle import button click
  importBtn.addEventListener('click', function() {
    if (localStorage.getItem('featuresActivated') !== 'true') {
      alert('Please activate your serial number first');
      return;
    }
    importModal.classList.add('show');
  });

  // Handle close modal
  closeModal.addEventListener('click', function() {
    importModal.classList.remove('show');
  });

  // Close modal when clicking outside
  importModal.addEventListener('click', function(e) {
    if (e.target === importModal) {
      importModal.classList.remove('show');
    }
  });

  // Handle file selection via input
  fileInput.addEventListener('change', function(e) {
    console.log('File input changed');
    const file = e.target.files[0];
    console.log('Selected file:', file);
    
    if (file) {
      // Update file name display
      const fileNameDisplay = document.getElementById('fileName');
      if (fileNameDisplay) {
        fileNameDisplay.textContent = `Selected file: ${file.name}`;
      }
      
      // Hide upload icon
      const uploadIcon = document.getElementById('uploadIcon');
      if (uploadIcon) {
        uploadIcon.style.display = 'none';
      }
      
      // Auto-fill payload name (remove extension)
      const namaPayloadInput = document.getElementById('nama-payload');
      if (namaPayloadInput) {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        namaPayloadInput.value = fileNameWithoutExt;
      }
      
      // Enable submit button
      submitButton.disabled = false;
    }
  });

  // Handle browse button click
  browseBtn.addEventListener('click', function() {
    console.log('Browse button clicked');
    fileInput.click();
  });

  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.add('highlight');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.remove('highlight');
    }, false);
  });

  // Handle file drop
  uploadArea.addEventListener('drop', function(e) {
    console.log('File dropped');
    const dt = e.dataTransfer;
    const files = dt.files;
    const file = files[0];
    console.log('Dropped file:', file);
    
    if (file) {
      // Update file input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Update file name display
      const fileNameDisplay = document.getElementById('fileName');
      if (fileNameDisplay) {
        fileNameDisplay.textContent = `Selected file: ${file.name}`;
      }
      
      // Hide upload icon
      const uploadIcon = document.getElementById('uploadIcon');
      if (uploadIcon) {
        uploadIcon.style.display = 'none';
      }
      
      // Auto-fill payload name (remove extension)
      const namaPayloadInput = document.getElementById('nama-payload');
      if (namaPayloadInput) {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        namaPayloadInput.value = fileNameWithoutExt;
      }
      
      // Enable submit button
      submitButton.disabled = false;
    }
  });

  // Handle submit button click
  submitButton.addEventListener('click', handleUploadSubmit);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ================= PAYLOAD VIEWER ================= //

function setupPayloadModal() {
  document.querySelector('.close-payload-modal')?.addEventListener('click', () => {
      document.getElementById('viewPayloadModal').classList.remove('show');
  });

  document.getElementById('viewPayloadModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('viewPayloadModal')) {
          document.getElementById('viewPayloadModal').classList.remove('show');
      }
  });
}

function viewPayload(id, name) {
  if (!checkActivation()) return;

  fetch(`/get-payload-content/${id}`)
  .then(handleResponse)
  .then(data => {
      if (data.success) {
          const modal = document.getElementById('viewPayloadModal');
          document.getElementById('payloadName').textContent = name;
          
          const contentBody = document.getElementById('payloadContentBody');
          contentBody.innerHTML = data.content.map((line, index) => `
              <tr>
                  <td>${index + 1}</td>
                  <td>${line}</td>
              </tr>
          `).join('');
          
          modal.classList.add('show');
      }
  })
  .catch(handleError);
}

// ================= ACTIVATION FEATURES ================= //

function setupActivationFeatures() {
  // Check activation status on page load
  checkActivationStatus();

  // Disable interactive elements if not activated
  if (localStorage.getItem('featuresActivated') !== 'true') {
    disablePayloadFeatures();
  }
}

function checkActivationStatus() {
  if (localStorage.getItem('featuresActivated') === 'true') {
    enablePayloadFeatures();
  }
}

function disablePayloadFeatures() {
  // Disable import button
  const importBtn = document.querySelector('.import');
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.style.opacity = '0.6';
    importBtn.style.cursor = 'not-allowed';
  }

  // Disable all delete buttons
  document.querySelectorAll('.fa-trash-alt').forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  });

  // Disable file input if modal is opened
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.disabled = true;

  const submitUpload = document.getElementById('submitUpload');
  if (submitUpload) submitUpload.disabled = true;
}

function enablePayloadFeatures() {
  // Enable import button
  const importBtn = document.querySelector('.import');
  if (importBtn) {
    importBtn.disabled = false;
    importBtn.style.opacity = '1';
    importBtn.style.cursor = 'pointer';
  }

  // Enable all delete buttons
  document.querySelectorAll('.fa-trash-alt').forEach(btn => {
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  });

  // Enable file input if modal is opened
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.disabled = false;

  const submitUpload = document.getElementById('submitUpload');
  if (submitUpload) submitUpload.disabled = false;
}

function checkActivation() {
  if (localStorage.getItem('featuresActivated') !== 'true') {
    alert('Please activate your serial number first');
    return false;
  }
  return true;
}

// ================= NOTIFICATIONS ================= //

function setupNotifications() {
  const notificationBtn = document.querySelector('.notification');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  const badge = document.querySelector('.notification .badge');

  if (!notificationBtn || !notificationDropdown || !badge) return;

  // Set initial notification count
  badge.style.display = 'flex';
  badge.textContent = '3';

  notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationDropdown.style.display = 
      notificationDropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
      notificationDropdown.style.display = 'none';
    }
  });

  // Handle "Read all notifications"
  const readAllBtn = document.querySelector('.read-all-notifications');
  if (readAllBtn) {
    readAllBtn.addEventListener('click', function() {
      badge.style.display = 'none';
      badge.textContent = '0';
      notificationDropdown.style.display = 'none';
    });
  }
}

// ================= CLOCK ================= //

function setupClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const hours = String(wibTime.getUTCHours()).padStart(2, '0');
  const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(wibTime.getUTCSeconds()).padStart(2, '0');
  const clockElement = document.getElementById('clock');
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
}

// ================= HELPER FUNCTIONS ================= //

function handleResponse(response) {
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

function handleError(error) {
  console.error('Error:', error);
  showAlert('An error occurred. Please try again.', 'error');
}

function validateUpload(file, namaPayload) {
  if (!file) {
    showAlert('Please select a file to upload.', 'error');
    return false;
  }

  if (!namaPayload) {
    showAlert('Please enter a name for the payload.', 'error');
    return false;
  }

  // Validate file type
  const allowedTypes = ['text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!allowedTypes.includes(file.type)) {
    showAlert('Invalid file type. Please upload .txt, .csv, or .xlsx files.', 'error');
    return false;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    showAlert('File size exceeds 10MB limit.', 'error');
    return false;
  }

  return true;
}

function resetUploadForm() {
  document.getElementById('uploadForm').reset();
  document.getElementById('fileName').textContent = '';
  document.getElementById('uploadIcon').style.display = 'block';
  document.getElementById('importModal').classList.remove('show');
}

function showAlert(message, type) {
  // Remove any existing alerts
  const existingAlert = document.querySelector('.alert-toast');
  if (existingAlert) {
    existingAlert.remove();
  }

  // Create new alert
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert-toast alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed top-0 end-0 m-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} me-2"></i>
      <span>${message}</span>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  // Add to document
  document.body.appendChild(alertDiv);

  // Auto remove after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function refreshTableData() {
  fetch('/get-payloads')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      const tbody = document.querySelector('#attackLogsTable tbody');
      if (!tbody) return;

      // Clear existing rows
      tbody.innerHTML = '';

      // Add new rows
      data.payloads.forEach(payload => {
        const row = document.createElement('tr');
        row.setAttribute('data-payload-id', payload.id);
        row.className = 'text-center';
        row.innerHTML = `
          <td class="checkbox-column">
            <input type="checkbox" class="form-check-input" />
          </td>
          <td class="id-column text-center">${payload.id}</td>
          <td class="text-center" data-label="Nama Payload">${payload.nama_payload}</td>
          <td class="text-center" data-label="Jumlah Baris">${payload.jumlah_baris}</td>
          <td class="d-flex justify-content-center gap-2">
            <button class="btn text-info btn-link" onclick="viewPayload('${payload.id}', '${payload.nama_payload}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn text-danger btn-link" onclick="deletePayload('${payload.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } else {
      throw new Error(data.message || 'Failed to refresh table data');
    }
  })
  .catch(error => {
    console.error('Error refreshing table:', error);
    showAlert('Failed to refresh table data. Please try again.', 'error');
  });
}

function handleUploadSubmit() {
  if (!checkActivation()) {
    showAlert('Please activate your serial number first', 'error');
    return;
  }

  const file = document.getElementById('fileInput').files[0];
  const namaPayload = document.getElementById('nama-payload').value;
  const severity = document.getElementById('severity').value;

  if (!validateUpload(file, namaPayload)) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('nama_payload', namaPayload);
  formData.append('severity', severity);

  // Show loading state
  const submitButton = document.getElementById('submitUpload');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  fetch('/upload-endpoint', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      showAlert('File uploaded successfully!', 'success');
      resetUploadForm();
      refreshTableData();
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  })
  .catch(error => {
    console.error('Upload error:', error);
    showAlert(error.message || 'An error occurred during upload. Please try again.', 'error');
  })
  .finally(() => {
    // Reset button state
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  });
}

function deletePayload(id) {
  if (!checkActivation()) return;

  if (confirm('Are you sure you want to delete this payload?')) {
    fetch(`/delete-payload/${id}`, {
      method: 'DELETE'
    })
    .then(handleResponse)
    .then(data => {
      if (data.success) {
        const row = document.querySelector(`tr[data-payload-id="${id}"]`);
        if (row) row.remove();
        showAlert('Payload deleted successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to delete payload');
      }
    })
    .catch(handleError);
  }
} 