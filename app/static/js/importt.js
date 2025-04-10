document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initializeDateRangeModal();
  initializeSearch();
  initializePagination();
  initializeNotifications();
  setupFileUpload();
  setupPayloadModal();

  // Check activation status
  if (localStorage.getItem('featuresActivated') !== 'true') {
      disablePayloadFeatures();
  }

  // Secure delete buttons
  document.querySelectorAll('.fa-trash-alt').forEach(btn => {
      btn.onclick = function() {
          if (!checkActivation()) return false;
          return deletePayload(this.dataset.payloadId || this.closest('[data-payload-id]').dataset.payloadId);
      };
  });

  // Secure import button
  document.querySelector('.import')?.addEventListener('click', function(e) {
      if (!checkActivation()) {
          e.preventDefault();
          return false;
      }
      document.getElementById('importModal').classList.add('show');
      return true;
  });
});

// ================= CORE FUNCTIONALITY ================= //

function checkActivation() {
  if (localStorage.getItem('featuresActivated') !== 'true') {
      showAlert('Please activate your serial number first', 'error');
      return false;
  }
  return true;
}

function deletePayload(id) {
  if (!confirm('Are you sure you want to delete this payload?')) return;
  
  fetch(`/delete-payload/${id}`, {
      method: 'DELETE'
  })
  .then(handleResponse)
  .then(data => {
      if (data.success) {
          document.querySelector(`tr[data-payload-id="${id}"]`)?.remove();
          showAlert('Payload deleted successfully', 'success');
      }
  })
  .catch(handleError);
}

// ================= FEATURE CONTROL ================= //

function enablePayloadFeatures() {
  // Enable import button
  const importBtn = document.querySelector('.import');
  if (importBtn) {
      importBtn.disabled = false;
      importBtn.classList.remove('disabled-feature');
  }

  // Enable delete buttons
  document.querySelectorAll('.fa-trash-alt').forEach(btn => {
      btn.classList.remove('disabled-feature');
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
  });
}

function disablePayloadFeatures() {
  // Disable import button
  const importBtn = document.querySelector('.import');
  if (importBtn) {
      importBtn.disabled = true;
      importBtn.classList.add('disabled-feature');
  }

  // Disable delete buttons
  document.querySelectorAll('.fa-trash-alt').forEach(btn => {
      btn.classList.add('disabled-feature');
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.6';
  });
}

// ================= FILE UPLOAD ================= //

function setupFileUpload() {
  const uploadArea = document.querySelector('.upload-area');
  const fileInput = document.getElementById('fileInput');
  const submitButton = document.getElementById('submitUpload');

  if (!uploadArea || !fileInput || !submitButton) return;

  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => uploadArea.classList.add('highlight'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('highlight'), false);
  });

  uploadArea.addEventListener('drop', handleDrop, false);
  fileInput.addEventListener('change', handleFileSelect);
  submitButton.addEventListener('click', handleUploadSubmit);
}

function handleUploadSubmit() {
  if (!checkActivation()) return;

  const file = document.getElementById('fileInput').files[0];
  const namaPayload = document.getElementById('nama-payload').value;
  const severity = document.getElementById('severity').value;

  if (!validateUpload(file, namaPayload)) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('nama_payload', namaPayload);
  formData.append('severity', severity);

  fetch('/upload-endpoint', {
      method: 'POST',
      body: formData
  })
  .then(handleResponse)
  .then(data => {
      if (data.success) {
          resetUploadForm();
          refreshTableData();
      }
  })
  .catch(handleError);
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

// ================= HELPER FUNCTIONS ================= //

function handleResponse(response) {
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

function handleError(error) {
  console.error('Error:', error);
  showAlert('An error occurred. Please try again.', 'error');
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFileSelect() {
  const file = this.files[0];
  if (file) {
      document.getElementById('fileName').textContent = `Selected file: ${file.name}`;
      document.getElementById('uploadIcon').style.display = 'none';
      document.getElementById('nama-payload').value = file.name.replace(/\.[^/.]+$/, "");
  }
}

function handleFiles(files) {
  const file = files[0];
  if (file) {
      document.getElementById('fileInput').files = files;
      handleFileSelect.call({ files: files });
  }
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
  return true;
}

function resetUploadForm() {
  document.getElementById('uploadForm').reset();
  document.getElementById('fileName').textContent = '';
  document.getElementById('uploadIcon').style.display = 'block';
  document.getElementById('importModal').classList.remove('show');
}

function refreshTableData() {
  fetch('/get-payloads')
  .then(handleResponse)
  .then(data => {
      if (data.success) {
          const tbody = document.querySelector('#attackLogsTable tbody');
          if (!tbody) return;
          
          tbody.innerHTML = data.payloads.map(payload => `
              <tr data-payload-id="${payload.id}">
                  <td class="checkbox-column"><input type="checkbox" class="form-check-input"></td>
                  <td class="id-column text-center">${payload.id}</td>
                  <td class="text-center">${payload.nama_payload}</td>
                  <td class="text-center">${payload.jumlah_baris}</td>
                  <td class="d-flex justify-content-center gap-2">
                      <button class="btn text-info btn-link" onclick="viewPayload('${payload.id}', '${payload.nama_payload}')">
                          <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn text-danger btn-link" onclick="deletePayload('${payload.id}')">
                          <i class="fas fa-trash-alt"></i>
                      </button>
                  </td>
              </tr>
          `).join('');
      }
  })
  .catch(handleError);
}

function showAlert(message, type) {
  // Replace with your preferred notification system
  alert(`${type.toUpperCase()}: ${message}`);
}

// Also add initialization when page loads
// document.addEventListener('DOMContentLoaded', function() {
//     initializePagination();
// });

// // Add this function to handle pagination
// function initializePagination() {
//   const table = document.getElementById('attackLogsTable');
//   const tbody = table.querySelector('tbody');
//   const rows = tbody.querySelectorAll('tr');
//   const rowsPerPage = 10;
//   const pageCount = Math.ceil(rows.length / rowsPerPage);
//   let currentPage = 1;

//   // Create pagination controls
//   function updatePagination() {
//       const paginationContainer = document.querySelector('.pagination');
//       paginationContainer.innerHTML = `
//           <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}" onclick="return false">&laquo;</a></li>
//       `;

//       // Add page numbers
//       for (let i = 1; i <= pageCount; i++) {
//           if (i === 1 || i === pageCount || (i >= currentPage - 1 && i <= currentPage + 1)) {
//               paginationContainer.innerHTML += `
//                   <li><a href="#" class="${i === currentPage ? 'active' : ''}" onclick="return false">${i}</a></li>
//               `;
//           } else if (i === currentPage - 2 || i === currentPage + 2) {
//               paginationContainer.innerHTML += `
//                   <li><a href="#" class="pagination-dots" onclick="return false">...</a></li>
//               `;
//           }
//       }

//       paginationContainer.innerHTML += `
//           <li><a href="#" class="pagination-arrow ${currentPage === pageCount ? 'disabled' : ''}" onclick="return false">&raquo;</a></li>
//       `;

//       // Add click events to pagination controls
//       const paginationLinks = paginationContainer.querySelectorAll('a');
//       paginationLinks.forEach(link => {
//           link.addEventListener('click', (e) => {
//               e.preventDefault();
//               if (link.classList.contains('disabled')) return;

//               if (link.classList.contains('pagination-arrow')) {
//                   if (link.textContent === '«') {
//                       if (currentPage > 1) currentPage--;
//                   } else {
//                       if (currentPage < pageCount) currentPage++;
//                   }
//               } else if (!link.classList.contains('pagination-dots')) {
//                   currentPage = parseInt(link.textContent);
//               }
//               updatePage();
//           });
//       });
      
//   }

//   // Show current page
//   function updatePage() {
//       const start = (currentPage - 1) * rowsPerPage;
//       const end = start + rowsPerPage;

//       rows.forEach((row, index) => {
//           row.style.display = (index >= start && index < end) ? '' : 'none';
//       });

//       updatePagination();
//   }

//   // Initialize first page
//   updatePage();
// }

// // Update the search functionality
// function initializeSearch() {
//     const searchInput = document.querySelector('.search-box input');
//     const table = document.getElementById('attackLogsTable');
//     const tbody = table.querySelector('tbody');
//     const rows = tbody.getElementsByTagName('tr');
//     const rowsPerPage = parseInt(document.querySelector('.rows-per-page').value) || 10;
//     let currentPage = 1;
//     const noResultsRow = document.createElement('tr');
    
//     // Create "No results found" message row
//     noResultsRow.innerHTML = `
//         <td colspan="5" class="text-center py-4">
//             <div class="alert alert-info mb-0">
//                 Tidak ada hasil yang ditemukan
//             </div>
//         </td>
//     `;

//     function highlightText(text, searchTerm) {
//         if (!searchTerm) return text;
//         const regex = new RegExp(`(${searchTerm})`, 'gi');
//         return text.replace(regex, '<mark style="background-color: yellow; padding: 0;">$1</mark>');
//     }

//     function updatePaginationForSearch(matchingRows) {
//         const pageCount = Math.ceil(matchingRows.length / rowsPerPage);
//         currentPage = 1; // Reset to first page when searching

//         // Hide all rows initially
//         Array.from(rows).forEach(row => {
//             row.style.display = 'none';
//         });

//         const paginationContainer = document.querySelector('.pagination');
        
//         if (matchingRows.length > 0) {
//             paginationContainer.style.display = 'flex';
//             paginationContainer.innerHTML = `
//                 <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}">&laquo;</a></li>
//             `;

//             for (let i = 1; i <= pageCount; i++) {
//                 if (i === 1 || i === pageCount || (i >= currentPage - 1 && i <= currentPage + 1)) {
//                     paginationContainer.innerHTML += `
//                         <li><a href="#" class="${i === currentPage ? 'active' : ''}">${i}</a></li>
//                     `;
//                 } else if (i === currentPage - 2 || i === currentPage + 2) {
//                     paginationContainer.innerHTML += `
//                         <li><a href="#" class="pagination-dots">...</a></li>
//                     `;
//                 }
//             }

//             paginationContainer.innerHTML += `
//                 <li><a href="#" class="pagination-arrow ${currentPage === pageCount ? 'disabled' : ''}">&raquo;</a></li>
//             `;

//             // Show first page of results
//             matchingRows.forEach((row, index) => {
//                 if (index < rowsPerPage) {
//                     row.style.display = '';
//                 }
//             });

//             // Add click events to pagination
//             const paginationLinks = paginationContainer.querySelectorAll('a');
//             paginationLinks.forEach(link => {
//                 link.addEventListener('click', (e) => {
//                     e.preventDefault();
//                     if (link.classList.contains('disabled')) return;

//                     if (link.classList.contains('pagination-arrow')) {
//                         if (link.textContent === '«') {
//                             if (currentPage > 1) currentPage--;
//                         } else {
//                             if (currentPage < pageCount) currentPage++;
//                         }
//                     } else if (!link.classList.contains('pagination-dots')) {
//                         currentPage = parseInt(link.textContent);
//                     }

//                     // Update visible rows
//                     matchingRows.forEach((row, index) => {
//                         if (index >= (currentPage - 1) * rowsPerPage && index < currentPage * rowsPerPage) {
//                             row.style.display = '';
//                         } else {
//                             row.style.display = 'none';
//                         }
//                     });

//                     // Update active state
//                     paginationLinks.forEach(link => link.classList.remove('active'));
//                     if (!link.classList.contains('pagination-arrow')) {
//                         link.classList.add('active');
//                     }
//                 });
//             });
//         } else {
//             paginationContainer.style.display = 'none';
//         }
//     }

//     searchInput.addEventListener('keyup', function() {
//         const searchTerm = this.value.toLowerCase().trim();
//         let matchingRows = [];

//         // Remove existing "No results" row if it exists
//         const existingNoResults = tbody.querySelector('tr[data-no-results]');
//         if (existingNoResults) {
//             existingNoResults.remove();
//         }

//         // Search in each row
//         Array.from(rows).forEach(row => {
//             // Store original cell contents if not already stored
//             if (!row.hasAttribute('data-original')) {
//                 const originalContent = {};
//                 row.querySelectorAll('td').forEach((td, index) => {
//                     // Skip checkbox column and action column
//                     if (index !== 0 && !td.querySelector('button') && !td.querySelector('i')) {
//                         originalContent[index] = td.innerHTML;
//                     }
//                 });
//                 row.setAttribute('data-original', JSON.stringify(originalContent));
//             }

//             // Get original content
//             const originalContent = JSON.parse(row.getAttribute('data-original'));
//             let found = false;

//             // Check each cell and highlight if match found
//             row.querySelectorAll('td').forEach((td, index) => {
//                 // Skip checkbox column and action column
//                 if (index !== 0 && !td.querySelector('button') && !td.querySelector('i')) {
//                     const originalText = originalContent[index];
//                     if (originalText && originalText.toLowerCase().includes(searchTerm)) {
//                         found = true;
//                         if (searchTerm) {
//                             td.innerHTML = highlightText(originalText, searchTerm);
//                         } else {
//                             td.innerHTML = originalText;
//                         }
//                     } else if (!searchTerm && originalText) {
//                         td.innerHTML = originalText;
//                     }
//                 }
//             });

//             if (found) {
//                 matchingRows.push(row);
//             }
//         });

//         // Show "No results" message if no matches found and there's a search term
//         if (matchingRows.length === 0 && searchTerm !== '') {
//             noResultsRow.setAttribute('data-no-results', 'true');
//             tbody.appendChild(noResultsRow);
//         }

//         // Update pagination with matching rows
//         updatePaginationForSearch(matchingRows);
//     });
// }

// // Add rows per page change handler
// document.querySelector('.rows-per-page').addEventListener('change', function() {
//     initializePagination();
// });

// // Make sure search and pagination are initialized when document loads
// document.addEventListener('DOMContentLoaded', function() {
//     initializeSearch();
//     initializePagination();
// });
