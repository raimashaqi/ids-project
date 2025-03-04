function deletePayload(id) {
    if (confirm('Are you sure you want to delete this payload?')) {
      fetch(`/delete-payload/${id}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
      
        if (data.success) {
          const row = document.querySelector(`tr[data-payload-id="${id}"]`);
          if (row) {
            row.remove();
            showNotification('Payload deleted successfully', 'success');
          }
        } else {
          showNotification('Failed to delete payload: ' + (data.message || 'Unknown error'), 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting payload:', error);
        showNotification('An error occurred while deleting the payload', 'error');
      });
    }
  }

  //konfirmasi logout
function confirmLogout(event) {
  event.preventDefault();
  if (confirm('Apakah Anda yakin ingin logout?')) {
    window.location.href = '/logout';
  }
}
// Add this to your existing JavaScript
const uploadArea = document.querySelector('.upload-area');
const fileInput = document.getElementById('fileInput');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  uploadArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Handle drag and drop visual feedback
['dragenter', 'dragover'].forEach(eventName => {
  uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  uploadArea.classList.add('highlight');
}

function unhighlight(e) {
  uploadArea.classList.remove('highlight');
}

// Handle dropped files
uploadArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

// Handle file input change
fileInput.addEventListener('change', function (e) {
  const file = this.files[0];
  if (file) {
      document.getElementById('fileName').textContent = `Selected file: ${file.name}`; // Menampilkan nama file yang dipilih
      document.getElementById('uploadIcon').style.display = 'none'; // Menghilangkan ikon setelah file dipilih
      document.getElementById('uploadIconContainer').style.display = 'none'; // Menghilangkan kontainer ikon
      document.getElementById('nama-payload').value = file.name.replace(/\.[^/.]+$/, ""); // Mengatur nama payload menjadi nama file tanpa ekstensi
  } else {
      document.getElementById('fileName').textContent = ''; // Menghapus nama file jika tidak ada
      document.getElementById('uploadIcon').style.display = 'block'; // Menampilkan ikon jika tidak ada file
  }
});


// Handle the submit upload button click
document.getElementById('submitUpload').addEventListener('click', function() {
    const file = fileInput.files[0];
    const namaPayload = document.getElementById('nama-payload').value;
    const severity = document.getElementById('severity').value;

    // Validasi input
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    if (!namaPayload) {
        alert('Please enter a name for the payload.');
        return;
    }

    // Menggunakan FormData untuk mengirim file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_payload', namaPayload);
    formData.append('severity', severity);

    // Mengirim file ke server
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
        console.log('Server response:', data); 
        if (data.success) {
            console.log('Payload data:', data.payload); 
            
            // Close modal
            document.getElementById('importModal').classList.remove('show');
            
            // Show success notification
            showNotification('File uploaded successfully', 'success');
            
            // Reset form
            document.getElementById('uploadForm').reset();
            document.getElementById('fileName').textContent = '';
            document.getElementById('uploadIcon').style.display = 'block';
            document.getElementById('uploadIconContainer').style.display = 'block';

            // Refresh table data immediately
            refreshTableData();
        } else {
            showNotification('Upload failed: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        showNotification('An error occurred while uploading the file', 'error');
    });
});

function handleFiles(files) {
  // Pastikan ada file yang dipilih
  if (!files || files.length === 0) {
    console.error("No files selected.");
    return;
  }

  const file = files[0];
  const validTypes = [
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Validasi tipe file
  if (!validTypes.includes(file.type)) {
    alert('Please upload only .txt or .csv Excel files');
    return;
  }

  // Menggunakan FormData untuk mengirim file
  const formData = new FormData();
  formData.append('file', file);

  // Mengirim file ke server
  fetch('/upload-endpoint', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      // Pastikan respons OK, jika tidak lempar error
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('File uploaded successfully:', data);
        // Jika fungsi updateTable ada, panggil untuk memperbarui tabel
        if (typeof updateTable === 'function' && data.payload) {
          updateTable(data.payload);
        }
      } else {
        alert('Upload failed: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file.');
    });
    
}



// Fungsi untuk refresh data tabel
function refreshTableData() {
  fetch('/get-payloads')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#attackLogsTable tbody');
      if (!tbody) return;
      
      // Bersihkan tabel yang ada
      tbody.innerHTML = '';
      
      // Tambahkan data baru
      data.payloads.forEach(payload => {
        const row = document.createElement('tr');
        row.setAttribute('data-payload-id', payload.id);
        
        row.innerHTML = `
          <td class="checkbox-column"><input type="checkbox" class="form-check-input"></td>
          <td class="id-column">${payload.id}</td>
          <td data-label="Nama Payload">${payload.nama_payload}</td>
          <td data-label="Jumlah Baris">${payload.jumlah_baris}</td>
          <td>
            <i class="fas fa-trash-alt text-danger" onclick="deletePayload('${payload.id}')"></i>
          </td>
        `;
        
        tbody.appendChild(row);
      });
      
      // Tampilkan notifikasi sukses
      showNotification('Data has been refreshed', 'success');
    })
    .catch(error => {
      console.error('Error refreshing table:', error);
      showNotification('Failed to refresh data', 'error');
    });
}
