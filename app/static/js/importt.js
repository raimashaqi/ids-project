document.addEventListener('DOMContentLoaded', function() {
  // Initialize date range modal functionality
  initializeDateRangeModal();
  
  // Initialize other functionalities
  initializeSearch();
  initializePagination();
  initializeNotifications();
});

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
const submitButton = document.getElementById('submitUpload');

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
      document.getElementById('fileName').textContent = `Selected file: ${file.name}`;
      document.getElementById('uploadIcon').style.display = 'none';
      document.getElementById('uploadIconContainer').style.display = 'none';
      document.getElementById('nama-payload').value = file.name.replace(/\.[^/.]+$/, "");
  } else {
      document.getElementById('fileName').textContent = '';
      document.getElementById('uploadIcon').style.display = 'block';
  }
});

// Handle submit button click
submitButton.addEventListener('click', function() {
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
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Reset form
          document.getElementById('uploadForm').reset();
          document.getElementById('fileName').textContent = '';
          document.getElementById('uploadIcon').style.display = 'block';
          document.getElementById('uploadIconContainer').style.display = 'block';

          // Close modal
          document.getElementById('importModal').classList.remove('show');
          
          // Refresh table data immediately
          refreshTableData();
      } else {
          alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
  })
  .catch(error => {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file');
  });
});

// Function to handle drag and drop
function handleFiles(files) {
  const file = files[0];
  if (file) {
      document.getElementById('fileName').textContent = `Selected file: ${file.name}`;
      document.getElementById('uploadIcon').style.display = 'none';
      document.getElementById('uploadIconContainer').style.display = 'none';
      document.getElementById('nama-payload').value = file.name.replace(/\.[^/.]+$/, "");
      fileInput.files = files;
  }
}

// Function to view payload content
function viewPayload(id, name) {
  fetch(`/get-payload-content/${id}`)
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const modal = document.getElementById('viewPayloadModal');
              const payloadName = document.getElementById('payloadName');
              const contentBody = document.getElementById('payloadContentBody');
              
              // Set payload name
              payloadName.textContent = name;
              
              // Clear existing content
              contentBody.innerHTML = '';
              
              // Add payload content to table
              data.content.forEach((line, index) => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${line}</td>
                  `;
                  contentBody.appendChild(row);
              });
              
              // Show modal
              modal.classList.add('show');
          } else {
              alert('Failed to load payload content: ' + (data.message || 'Unknown error'));
          }
      })
      .catch(error => {
          console.error('Error loading payload content:', error);
          alert('An error occurred while loading the payload content');
      });
}

// Handle closing the payload content modal
document.querySelector('.close-payload-modal').addEventListener('click', () => {
  document.getElementById('viewPayloadModal').classList.remove('show');
});

// Close payload modal when clicking outside
document.getElementById('viewPayloadModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('viewPayloadModal')) {
      document.getElementById('viewPayloadModal').classList.remove('show');
  }
});

// Update the refreshTableData function
function refreshTableData() {
  fetch('/get-payloads')
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              const tbody = document.querySelector('#attackLogsTable tbody');
              if (!tbody) return;
              
              // Clear existing table
              tbody.innerHTML = '';
              
              // Add new data
              data.payloads.forEach(payload => {
                  const row = document.createElement('tr');
                  row.setAttribute('data-payload-id', payload.id);
                  
                  row.innerHTML = `
                      <td class="checkbox-column"><input type="checkbox" class="form-check-input"></td>
                      <td class="id-column">${payload.id}</td>
                      <td data-label="Nama Payload">${payload.nama_payload}</td>
                      <td data-label="Jumlah Baris">${payload.jumlah_baris}</td>
                      <td class="d-flex justify-content-start gap-2">
                          <button class="btn text-info btn-link" onclick="viewPayload('${payload.id}', '${payload.nama_payload}')">
                              <i class="fas fa-eye"></i>
                          </button>
                          <i class="fas fa-trash-alt btn text-danger btn-link" onclick="deletePayload('${payload.id}')"></i>
                      </td>
                  `;
                  
                  tbody.appendChild(row);
              });

              // Initialize pagination after adding new data
              initializePagination();

          }
      })
      .catch(error => {
          console.error('Error refreshing table:', error);
          alert('Failed to refresh data');
      });
}

// Also add initialization when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePagination();
});

// Add this function to handle pagination
function initializePagination() {
  const table = document.getElementById('attackLogsTable');
  const tbody = table.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  const rowsPerPage = 10;
  const pageCount = Math.ceil(rows.length / rowsPerPage);
  let currentPage = 1;

  // Create pagination controls
  function updatePagination() {
      const paginationContainer = document.querySelector('.pagination');
      paginationContainer.innerHTML = `
          <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}" onclick="return false">&laquo;</a></li>
      `;

      // Add page numbers
      for (let i = 1; i <= pageCount; i++) {
          if (i === 1 || i === pageCount || (i >= currentPage - 1 && i <= currentPage + 1)) {
              paginationContainer.innerHTML += `
                  <li><a href="#" class="${i === currentPage ? 'active' : ''}" onclick="return false">${i}</a></li>
              `;
          } else if (i === currentPage - 2 || i === currentPage + 2) {
              paginationContainer.innerHTML += `
                  <li><a href="#" class="pagination-dots" onclick="return false">...</a></li>
              `;
          }
      }

      paginationContainer.innerHTML += `
          <li><a href="#" class="pagination-arrow ${currentPage === pageCount ? 'disabled' : ''}" onclick="return false">&raquo;</a></li>
      `;

      // Add click events to pagination controls
      const paginationLinks = paginationContainer.querySelectorAll('a');
      paginationLinks.forEach(link => {
          link.addEventListener('click', (e) => {
              e.preventDefault();
              if (link.classList.contains('disabled')) return;

              if (link.classList.contains('pagination-arrow')) {
                  if (link.textContent === '«') {
                      if (currentPage > 1) currentPage--;
                  } else {
                      if (currentPage < pageCount) currentPage++;
                  }
              } else if (!link.classList.contains('pagination-dots')) {
                  currentPage = parseInt(link.textContent);
              }
              updatePage();
          });
      });
      
  }

  // Show current page
  function updatePage() {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;

      rows.forEach((row, index) => {
          row.style.display = (index >= start && index < end) ? '' : 'none';
      });

      updatePagination();
  }

  // Initialize first page
  updatePage();
}

// Update the search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    const table = document.getElementById('attackLogsTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');
    const rowsPerPage = parseInt(document.querySelector('.rows-per-page').value) || 10;
    let currentPage = 1;
    const noResultsRow = document.createElement('tr');
    
    // Create "No results found" message row
    noResultsRow.innerHTML = `
        <td colspan="5" class="text-center py-4">
            <div class="alert alert-info mb-0">
                Tidak ada hasil yang ditemukan
            </div>
        </td>
    `;

    function highlightText(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark style="background-color: yellow; padding: 0;">$1</mark>');
    }

    function updatePaginationForSearch(matchingRows) {
        const pageCount = Math.ceil(matchingRows.length / rowsPerPage);
        currentPage = 1; // Reset to first page when searching

        // Hide all rows initially
        Array.from(rows).forEach(row => {
            row.style.display = 'none';
        });

        const paginationContainer = document.querySelector('.pagination');
        
        if (matchingRows.length > 0) {
            paginationContainer.style.display = 'flex';
            paginationContainer.innerHTML = `
                <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}">&laquo;</a></li>
            `;

            for (let i = 1; i <= pageCount; i++) {
                if (i === 1 || i === pageCount || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    paginationContainer.innerHTML += `
                        <li><a href="#" class="${i === currentPage ? 'active' : ''}">${i}</a></li>
                    `;
                } else if (i === currentPage - 2 || i === currentPage + 2) {
                    paginationContainer.innerHTML += `
                        <li><a href="#" class="pagination-dots">...</a></li>
                    `;
                }
            }

            paginationContainer.innerHTML += `
                <li><a href="#" class="pagination-arrow ${currentPage === pageCount ? 'disabled' : ''}">&raquo;</a></li>
            `;

            // Show first page of results
            matchingRows.forEach((row, index) => {
                if (index < rowsPerPage) {
                    row.style.display = '';
                }
            });

            // Add click events to pagination
            const paginationLinks = paginationContainer.querySelectorAll('a');
            paginationLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (link.classList.contains('disabled')) return;

                    if (link.classList.contains('pagination-arrow')) {
                        if (link.textContent === '«') {
                            if (currentPage > 1) currentPage--;
                        } else {
                            if (currentPage < pageCount) currentPage++;
                        }
                    } else if (!link.classList.contains('pagination-dots')) {
                        currentPage = parseInt(link.textContent);
                    }

                    // Update visible rows
                    matchingRows.forEach((row, index) => {
                        if (index >= (currentPage - 1) * rowsPerPage && index < currentPage * rowsPerPage) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });

                    // Update active state
                    paginationLinks.forEach(link => link.classList.remove('active'));
                    if (!link.classList.contains('pagination-arrow')) {
                        link.classList.add('active');
                    }
                });
            });
        } else {
            paginationContainer.style.display = 'none';
        }
    }

    searchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase().trim();
        let matchingRows = [];

        // Remove existing "No results" row if it exists
        const existingNoResults = tbody.querySelector('tr[data-no-results]');
        if (existingNoResults) {
            existingNoResults.remove();
        }

        // Search in each row
        Array.from(rows).forEach(row => {
            // Store original cell contents if not already stored
            if (!row.hasAttribute('data-original')) {
                const originalContent = {};
                row.querySelectorAll('td').forEach((td, index) => {
                    // Skip checkbox column and action column
                    if (index !== 0 && !td.querySelector('button') && !td.querySelector('i')) {
                        originalContent[index] = td.innerHTML;
                    }
                });
                row.setAttribute('data-original', JSON.stringify(originalContent));
            }

            // Get original content
            const originalContent = JSON.parse(row.getAttribute('data-original'));
            let found = false;

            // Check each cell and highlight if match found
            row.querySelectorAll('td').forEach((td, index) => {
                // Skip checkbox column and action column
                if (index !== 0 && !td.querySelector('button') && !td.querySelector('i')) {
                    const originalText = originalContent[index];
                    if (originalText && originalText.toLowerCase().includes(searchTerm)) {
                        found = true;
                        if (searchTerm) {
                            td.innerHTML = highlightText(originalText, searchTerm);
                        } else {
                            td.innerHTML = originalText;
                        }
                    } else if (!searchTerm && originalText) {
                        td.innerHTML = originalText;
                    }
                }
            });

            if (found) {
                matchingRows.push(row);
            }
        });

        // Show "No results" message if no matches found and there's a search term
        if (matchingRows.length === 0 && searchTerm !== '') {
            noResultsRow.setAttribute('data-no-results', 'true');
            tbody.appendChild(noResultsRow);
        }

        // Update pagination with matching rows
        updatePaginationForSearch(matchingRows);
    });
}

// Add rows per page change handler
document.querySelector('.rows-per-page').addEventListener('change', function() {
    initializePagination();
});

// Make sure search and pagination are initialized when document loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializePagination();
});
