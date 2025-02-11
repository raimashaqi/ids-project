document.querySelector('.hamburger').addEventListener('click', function () {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');

  sidebar.classList.toggle('collapsed');
  mainContent.classList.toggle('expanded');

  // Mengubah ikon hamburger
  const icon = this.querySelector('i');
  if (sidebar.classList.contains('collapsed')) {
    icon.classList.remove('fa-bars');
    icon.classList.add('fa-times');
  } else {
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  }
});

// Menutup sidebar ketika mengklik di luar sidebar
document.addEventListener('click', function (event) {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.querySelector('.hamburger');

  if (!sidebar.contains(event.target) && !hamburger.contains(event.target) && sidebar.classList.contains('collapsed')) {
    sidebar.classList.remove('collapsed');
    document.querySelector('.main-content').classList.remove('expanded');

    // Reset ikon
    const icon = hamburger.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  }
});

//export excel

function exportToExcel() {
  var table = document.getElementById('attackLogsTable');
  var wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });


  var ws = wb.Sheets["Sheet1"];
  var cols = [];
  var range = XLSX.utils.decode_range(ws['!ref']);

  for (var C = range.s.c; C <= range.e.c; ++C) {
    var maxWidth = 10;
    for (var R = range.s.r; R <= range.e.r; ++R) {
      var cell_address = { c: C, r: R };
      var cell_ref = XLSX.utils.encode_cell(cell_address);
      var cell = ws[cell_ref];

      if (cell && cell.v) {
        maxWidth = Math.max(maxWidth, cell.v.toString().length + 5);
      }
    }
    cols.push({ wch: maxWidth });
  }

  ws['!cols'] = cols;

  XLSX.writeFile(wb, 'data_tabel.xlsx');
}


//export csv
function exportToCSV() {
  var table = document.getElementById('attackLogsTable');
  var rows = table.querySelectorAll('tr');
  var csvContent = '';

  rows.forEach(function (row) {
    var cols = row.querySelectorAll('td, th');
    var rowData = [];
    cols.forEach(function (col) {
      rowData.push(col.innerText);
    });
    csvContent += rowData.join(',') + '\n';
  });


  var blob = new Blob([csvContent], { type: 'text/csv' });
  var url = window.URL.createObjectURL(blob);


  var a = document.createElement('a');
  a.href = url;
  a.download = 'data_tabel.csv';
  a.click();
}

//export txt

function exportToTXT() {
  var table = document.getElementById('attackLogsTable');
  var rows = table.querySelectorAll('tr');
  var txtContent = '';

  rows.forEach(function (row) {
    var cols = row.querySelectorAll('td, th');
    var rowData = [];
    cols.forEach(function (col) {
      rowData.push(col.innerText);
    });
    txtContent += rowData.join('\t') + '\n';
  });

  //  file blob TXT
  var blob = new Blob([txtContent], { type: 'text/plain' });
  var url = window.URL.createObjectURL(blob);

  //  link download
  var a = document.createElement('a');
  a.href = url;
  a.download = 'data_tabel.txt';
  a.click();
}

// Add this new code for checkbox functionality
document.addEventListener('DOMContentLoaded', function () {
  const selectAllCheckbox = document.getElementById('select');

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function () {
      const checkboxes = document.querySelectorAll('table tbody input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
      });
    });
  }

  // Add event listeners for export buttons
  const exportButtons = document.querySelectorAll('.export-option');
  exportButtons.forEach(button => {
    button.addEventListener('click', function () {
      const buttonText = this.textContent.trim();
      if (buttonText.includes('Excel')) {
        exportToExcel();
      } else if (buttonText.includes('CSV')) {
        exportToCSV();
      } else if (buttonText.includes('TXT')) {
        exportToTXT();
      }
      // Close modal after export
      document.getElementById('downloadModal').classList.remove('show');
    });
  });

  // Add sorting functionality
  const sortableHeader = document.querySelector('.sortable');
  let isAscending = true;

  if (sortableHeader) {
    sortableHeader.addEventListener('click', function () {
      const table = document.getElementById('attackLogsTable');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      // Toggle sort direction
      isAscending = !isAscending;

      // Update icon
      this.classList.toggle('asc', isAscending);

      // Sort rows
      rows.sort((a, b) => {
        const severityA = a.querySelector('[data-label="Severity"] span').textContent;
        const severityB = b.querySelector('[data-label="Severity"] span').textContent;

        const severityOrder = {
          'High': 3,
          'Medium': 2,
          'Low': 1,
          'Critical' : 4
        };

        const comparison = severityOrder[severityA] - severityOrder[severityB];
        return isAscending ? comparison : -comparison;
      });

      // Reorder rows in DOM
      rows.forEach(row => tbody.appendChild(row));
    });
  }

  // Update delete button event listeners
  const deleteButtons = document.querySelectorAll('.fa-trash');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const selectedCheckboxes = document.querySelectorAll('table tbody input[type="checkbox"]:checked');
      
      if (selectedCheckboxes.length > 0) {
        // Multiple deletion
        if (confirm(`Are you sure you want to delete ${selectedCheckboxes.length} selected logs?`)) {
          // Remove selected rows from the table
          selectedCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            if (row) {
              row.remove();
            }
          });
          // Uncheck the select all checkbox
          document.getElementById('select').checked = false;
        }
      } else {
        // Single deletion
        const row = this.closest('tr');
        if (confirm('Are you sure you want to delete this log?')) {
          row.remove();
        }
      }
    });
  });
  initializeSearch();
  initializePagination();
});

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
    const namaPayload = document.getElementById('nama-payload').value; // Ambil nama payload dari input
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
    formData.append('nama_payload', namaPayload); // Pastikan ini dikirim
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
        if (data.success) {
            console.log('File uploaded successfully:', data);
            // Menampilkan nama payload setelah upload
            document.getElementById('fileName').textContent = `Uploaded: ${data.payload.nama_payload} with ${data.payload.jumlah_baris} lines`;
            // Tutup modal setelah upload berhasil
            document.getElementById('importModal').classList.remove('show'); // Uncomment if you want to close the modal
        } else {
            alert('Upload failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error uploading file:', error);
        alert('An error occurred while uploading the file.');
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
    alert('Please upload only .txt, .csv, or Excel files');
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

// Update the delete functionality
function delete_log(id) {
  if (confirm('Are you sure you want to delete this log?')) {
    fetch(`/delete_log/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove the row from the table only after successful deletion
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
          row.remove();
        }
      } else {
        alert('Failed to delete log: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error deleting log:', error);
      alert('An error occurred while deleting the log');
    });
  }
}

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

// Update search function to work with pagination
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    const table = document.getElementById('attackLogsTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');
    const rowsPerPage = 10;
    let currentPage = 1;
    const noResultsRow = document.createElement('tr');
    
    // Create "No results found" message row
    noResultsRow.innerHTML = `
        <td colspan="10" style="text-align: center; padding: 20px;">
            No results found
        </td>
    `;

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
                <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}" onclick="return false">&laquo;</a></li>
            `;

            for (let i = 1; i <= pageCount; i++) {
                paginationContainer.innerHTML += `
                    <li><a href="#" class="${i === currentPage ? 'active' : ''}" onclick="return false">${i}</a></li>
                `;
            }

            paginationContainer.innerHTML += `
                <li><a href="#" class="pagination-arrow ${currentPage === pageCount ? 'disabled' : ''}" onclick="return false">&raquo;</a></li>
            `;

            // Show first page of results
            matchingRows.forEach((row, index) => {
                if (index < rowsPerPage) {
                    row.style.display = '';
                    // Restore severity badge
                    const severityCell = row.querySelector('[data-label="Severity"] span');
                    if (severityCell) {
                        const severity = severityCell.textContent.trim().toLowerCase();
                        severityCell.className = `severity-badge ${severity}`;
                    }
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
                    } else {
                        currentPage = parseInt(link.textContent);
                    }

                    // Update visible rows and maintain severity badges
                    matchingRows.forEach((row, index) => {
                        if (index >= (currentPage - 1) * rowsPerPage && index < currentPage * rowsPerPage) {
                            row.style.display = '';
                            // Restore severity badge
                            const severityCell = row.querySelector('[data-label="Severity"] span');
                            if (severityCell) {
                                const severity = severityCell.textContent.trim().toLowerCase();
                                severityCell.className = `severity-badge ${severity}`;
                            }
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
        const searchTerm = searchInput.value.toLowerCase().trim();
        let matchingRows = [];

        // Remove existing "No results" row if it exists
        const existingNoResults = tbody.querySelector('tr[data-no-results]');
        if (existingNoResults) {
            existingNoResults.remove();
        }

        // Search in each row
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            let rowMatch = false;

            // Store severity badge class before removing highlights
            const severityCell = row.querySelector('[data-label="Severity"] span');
            const severityClass = severityCell ? severityCell.className : '';

            // Remove existing highlights
            Array.from(cells).forEach(cell => {
                const regex = new RegExp(`<mark>(.*?)</mark>`, 'gi');
                cell.innerHTML = cell.innerHTML.replace(regex, '$1');
            });

            // Search in each cell
            Array.from(cells).forEach(cell => {
                const cellText = cell.textContent || cell.innerText;
                if (cellText.toLowerCase().includes(searchTerm)) {
                    rowMatch = true;
                    if (searchTerm !== '') {
                        const highlightedText = cellText.replace(
                            new RegExp(searchTerm, 'gi'),
                            match => `<mark>${match}</mark>`
                        );
                        cell.innerHTML = highlightedText;
                    }
                }
            });

            // Restore severity badge class
            if (severityCell) {
                severityCell.className = severityClass;
            }

            if (rowMatch) {
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

//chart
document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('logThreatsChart').getContext('2d');
  new Chart(ctx, {
      type: 'pie',
      data: {
          labels: ['Informative', 'Low', 'Medium', 'High', 'Critical'],
          datasets: [{
              data: [35, 25, 20, 15, 5],
              backgroundColor: [
                  '#2655CD', // Informative 
                  '#00FF26', // Low 
                  '#FF6E00', // Medium 
                  '#FF0C03', // High 
                  '#D80000'  // Critical
              ],
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: {
                  position: 'right',
                  labels: {
                      usePointStyle: true,
                      pointStyle: 'circle',
                      padding: 20,
                      font: {
                          size: 12
                      }
                  }
              }
          }
      }
  });
});

// Add this after your existing code
function viewItem(element) {
    const row = element.closest('tr');
    
    // Get values from the row
    const logTime = row.querySelector('[data-label="Log Time"]').textContent;
    const logMessage = row.querySelector('[data-label="Log Message"]').textContent;
    const payload = row.querySelector('[data-label="Payload"]').textContent;
    const severity = row.querySelector('[data-label="Severity"] span').textContent;
    
    // Set values in the modal
    document.getElementById('viewLogTime').textContent = logTime;
    document.getElementById('viewLogMessage').textContent = logMessage;
    document.getElementById('viewPayload').textContent = payload;
    document.getElementById('viewSeverity').textContent = severity;
    
    // Show the modal
    document.getElementById('viewModal').classList.add('show');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('show');
}


document.addEventListener('click', function(e) {
    const viewModal = document.getElementById('viewModal');
    if (e.target === viewModal) {
        closeViewModal();
    }
});


function closeRangeModal() {
    document.getElementById('rangeModal').classList.remove('show');
}

// Fungsi untuk reset filter date dan menampilkan semua data
function resetDateFilter() {
    // Reset input dates
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // Show all rows
    const rows = document.querySelectorAll('#attackLogsTable tbody tr');
    rows.forEach(row => {
        row.style.display = '';
    });
    
    
    closeRangeModal();
    
  initializePagination();
}

//counter tanggal
function applyDateFilter() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const rowsPerPage = 10;
  let currentPage = 1;
  
  if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
  }

  // Convert dates to comparable format
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59); 

  if (start > end) {
      alert('Start date cannot be later than end date');
      return;
  }

  const rows = document.querySelectorAll('#attackLogsTable tbody tr');
  let matchingRows = [];
  
  rows.forEach(row => {
      const dateCell = row.querySelector('[data-label="Log Time"]');
      const rowDate = new Date(dateCell.textContent.trim());
      
      if (rowDate >= start && rowDate <= end) {
          matchingRows.push(row);
      }
      row.style.display = 'none'; // Hide all rows initially
  });

  // Update pagination
  const pageCount = Math.ceil(matchingRows.length / rowsPerPage);
  const paginationContainer = document.querySelector('.pagination');

  if (matchingRows.length > 0) {
      // Show pagination if there are matching rows
      paginationContainer.style.display = 'flex';
      paginationContainer.innerHTML = `
          <li><a href="#" class="pagination-arrow ${currentPage === 1 ? 'disabled' : ''}" onclick="return false">&laquo;</a></li>
      `;

      paginationContainer.innerHTML += `
          <li><a href="#" class="${currentPage === 1 ? 'active' : ''}" onclick="return false">1</a></li>
      `;

      paginationContainer.innerHTML += `
          <li><a href="#" class="${currentPage === pageCount ? 'active' : ''}" onclick="return false">${pageCount}</a></li>
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
              } else {
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
      // Hide pagination if no results
      paginationContainer.style.display = 'none';
      
      // Show "No results" message
      const tbody = document.querySelector('#attackLogsTable tbody');
      const noResultsRow = document.createElement('tr');
      noResultsRow.innerHTML = `
          <td colspan="10" style="text-align: center; padding: 20px;">
              No results found for the selected date range
          </td>
      `;
      tbody.appendChild(noResultsRow);
  }

  // Close the modal after applying filter
  closeRangeModal();
}

// Set default date values when opening the range modal
document.querySelector('.date').addEventListener('click', () => {
    const today = new Date();
    const sebulan = new Date();
    sebulan.setDate(today.getDate() - 30);
    
    // Format dates for input fields (YYYY-MM-DD)
    document.getElementById('startDate').value = sebulan.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    document.getElementById('rangeModal').classList.add('show');
});

// Close modal when clicking outside
document.getElementById('rangeModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('rangeModal')) {
        closeRangeModal();
    }
});

// Reset date filter when search is used
document.querySelector('.search-box input').addEventListener('keyup', function() {
    const rows = document.querySelectorAll('#attackLogsTable tbody tr');
    rows.forEach(row => {
        if (this.value === '') {
            row.style.display = '';
        }
    });
});