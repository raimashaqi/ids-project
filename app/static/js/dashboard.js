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
  
  // Buat clone dari tabel untuk modifikasi
  var tableClone = table.cloneNode(true);
  
  // Hapus kolom aksi dari clone
  var rows = tableClone.rows;
  for (var i = 0; i < rows.length; i++) {
      // Hapus kolom terakhir (kolom aksi)
      rows[i].deleteCell(-1);
  }
  
  var wb = XLSX.utils.table_to_book(tableClone, { sheet: "Sheet1" });
  var ws = wb.Sheets["Sheet1"];
  
  // Auto-size columns
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


// //export csv
// function exportToCSV() {
//   var table = document.getElementById('attackLogsTable');
//   var rows = table.querySelectorAll('tr');
//   var csvContent = '';

//   rows.forEach(function (row) {
//     var cols = row.querySelectorAll('td, th');
//     var rowData = [];
//     cols.forEach(function (col) {
//       rowData.push(col.innerText);
//     });
//     csvContent += rowData.join(',') + '\n';
//   });


//   var blob = new Blob([csvContent], { type: 'text/csv' });
//   var url = window.URL.createObjectURL(blob);


//   var a = document.createElement('a');
//   a.href = url;
//   a.download = 'data_tabel.csv';
//   a.click();
// }

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

  // Notification functionality
  const notificationBtn = document.querySelector('.notification');
  const notificationDropdown = document.querySelector('.notification-dropdown');
  const badge = document.querySelector('.notification .badge');
  
  // Set initial notification count
  badge.style.display = 'flex';
  badge.textContent = '3';

  notificationBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationDropdown.style.display = notificationDropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
      notificationDropdown.style.display = 'none';
    }
  });

  // Handle "Read all notifications"
  const readAllBtn = document.querySelector('.read-all-notifications');
  readAllBtn.addEventListener('click', function() {
    badge.style.display = 'none';
    badge.textContent = '0';
    notificationDropdown.style.display = 'none';
  });
});


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
function viewItem(button) {
    const row = button.closest('tr');
    
    // Get values from the row
    const logTime = row.querySelector('[data-label="Log Time"]').textContent;
    const logMessage = row.querySelector('[data-label="Log Message"]').textContent;
    const severity = row.querySelector('[data-label="Severity"] span').textContent;
    
    // Set values in the modal
    document.getElementById('viewLogTime').textContent = logTime;
    document.getElementById('viewLogMessage').textContent = logMessage;
    document.getElementById('viewSeverity').textContent = severity;
    
    // Show the modal
    document.getElementById('viewModal').classList.add('show');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('show');
}

// // Close modal when clicking outside
// document.addEventListener('click', function(e) {
//     const viewModal = document.getElementById('viewModal');
//     if (e.target === viewModal) {
//         closeViewModal();
//     }
// });

// function closeRangeModal() {
//     const modal = document.getElementById('rangeModal');
//     if (modal) {
//         modal.classList.remove('show');
//     }
// }

// // Tambahkan fungsi untuk menangani klik tombol date
// document.querySelector('.date').addEventListener('click', function() {
//     const today = new Date();
//     const sebulan = new Date();
//     sebulan.setDate(today.getDate() - 30);
    
//     // Format tanggal untuk input fields (YYYY-MM-DD)
//     const startDateInput = document.getElementById('startDate');
//     const endDateInput = document.getElementById('endDate');
    
//     // Hanya set default values jika input belum memiliki nilai
//     if (!startDateInput.value) {
//         startDateInput.value = sebulan.toISOString().split('T')[0];
//     }
//     if (!endDateInput.value) {
//         endDateInput.value = today.toISOString().split('T')[0];
//     }
    
//     // Tampilkan modal
//     document.getElementById('rangeModal').classList.add('show');
// });

// // Tambahkan event listener untuk menutup modal ketika mengklik di luar modal
// document.addEventListener('click', function(e) {
//     const rangeModal = document.getElementById('rangeModal');
//     const dateButton = document.querySelector('.date');
    
//     if (e.target === rangeModal && !dateButton.contains(e.target)) {
//         closeRangeModal();
//     }
// });

// function applyDateFilter() {
//     const startDateInput = document.getElementById('startDate').value;
//     const endDateInput = document.getElementById('endDate').value;

//     if (!startDateInput || !endDateInput) {
//         alert('Silakan pilih tanggal awal dan akhir');
//         return;
//     }

//     // Konversi nilai input ke objek Date
//     const startDate = new Date(startDateInput);
//     const endDate = new Date(endDateInput);
//     endDate.setHours(23, 59, 59, 999); // Pastikan sampai akhir hari

//     console.log("Start Date:", startDate);
//     console.log("End Date:", endDate);

//     if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
//         alert('Format tanggal tidak valid');
//         return;
//     }

//     if (startDate > endDate) {
//         alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
//         return;
//     }

//     const table = document.getElementById('attackLogsTable');
//     if (!table) {
//         console.error('Table not found');
//         return;
//     }

//     const tbody = table.querySelector('tbody');
//     const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
//     let visibleRows = 0;

//     // Hapus pesan "tidak ada data" yang sudah ada
//     const existingNoData = tbody.querySelector('.no-data-row');
//     if (existingNoData) {
//         existingNoData.remove();
//     }

//     rows.forEach(row => {
//         const dateCell = row.querySelector('[data-label="Log Time"]');
//         if (dateCell) {
//             let dateText = dateCell.textContent.trim(); // Format 'YYYY-MM-DD HH:MM:SS'

//             // Konversi ke objek Date
//             let rowDate = new Date(dateText.replace(/-/g, '/')); // Pastikan bisa dibaca oleh JavaScript

//             console.log(`Row Date: ${dateText} => ${rowDate}`);

//             if (isNaN(rowDate.getTime())) {
//                 console.warn('Tanggal tidak valid:', dateText);
//                 return;
//             }

//             if (rowDate >= startDate && rowDate <= endDate) {
//                 row.style.display = '';
//                 visibleRows++;
//             } else {
//                 row.style.display = 'none';
//             }
//         }
//     });

//     // Jika tidak ada baris yang ditampilkan, tampilkan pesan "Tidak ada data"
//     if (visibleRows === 0) {
//         const noDataRow = document.createElement('tr');
//         noDataRow.className = 'no-data-row';
//         noDataRow.innerHTML = `
//             <td colspan="11" style="text-align: center; padding: 20px;">
//                 <div class="alert alert-info" role="alert">
//                     Tidak ada data untuk rentang tanggal yang dipilih
//                     <button class="btn btn-link" onclick="resetDateFilter()">Reset Filter</button>
//                 </div>
//             </td>
//         `;
//         tbody.appendChild(noDataRow);
//     }

//     closeRangeModal();
//     initializePagination();
// }



// function resetDateFilter() {
//     const startDateInput = document.getElementById('startDate');
//     const endDateInput = document.getElementById('endDate');
//     const table = document.getElementById('attackLogsTable');
    
//     if (!table || !startDateInput || !endDateInput) {
//         console.error('Required elements not found');
//         return;
//     }

//     // Reset input dates
//     startDateInput.value = '';
//     endDateInput.value = '';
    
//     // Show all rows
//     const tbody = table.querySelector('tbody');
//     const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
    
//     // Remove no data message if exists
//     const noDataRow = tbody.querySelector('.no-data-row');
//     if (noDataRow) {
//         noDataRow.remove();
//     }
    
//     // Show all data rows
//     rows.forEach(row => {
//         row.style.display = '';
//     });
    
//     closeRangeModal();
//     initializePagination();
// }

//export single row
function exportSingleRow(button) {
    const row = button.closest('tr');
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'singleExportModal';
    
    document.body.appendChild(modal);
    modal.classList.add('show');
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function exportSingleRowToExcel(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    const data = {
        ID: row.querySelector('.id-column').textContent,
        LogTime: row.querySelector('[data-label="Log Time"]').textContent,
        LogMessage: row.querySelector('[data-label="Log Message"]').textContent,
        SourceIP: row.querySelector('[data-label="Source IP"]').textContent,
        SourcePort: row.querySelector('[data-label="Source Port"]').textContent,
        DestinationIP: row.querySelector('[data-label="Destination IP"]').textContent,
        DestinationPort: row.querySelector('[data-label="Destination Port"]').textContent,
        Location: row.querySelector('[data-label="Location"]').textContent,
        Severity: row.querySelector('[data-label="Severity"] span').textContent
    };
    
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log");
    
    // Auto-size columns
    const cols = [];
    for (let key in data) {
        cols.push({ wch: Math.max(key.length, String(data[key]).length + 5) });
    }
    ws['!cols'] = cols;
  
    XLSX.writeFile(wb, `log_${rowId}.xlsx`);
}


//konfirmasi logout
function confirmLogout(event) {
  event.preventDefault();
  if (confirm('Apakah Anda yakin ingin logout?')) {
    window.location.href = '/logout';
  }
}

// Single DOMContentLoaded event listener for all initializations
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date range modal functionality
    initializeDateRangeModal();
    
    // Initialize other functionalities
    initializeSearch();
    initializePagination();
    initializeNotifications();
});

function initializeDateRangeModal() {
    const dateBtn = document.querySelector('.date');
    const rangeModal = document.getElementById('rangeModal');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (!dateBtn || !rangeModal || !startDateInput || !endDateInput) {
        console.error('Required elements for date range modal not found');
        return;
    }

    // Date button click handler
    dateBtn.addEventListener('click', function() {
        const today = new Date();
        const sebulan = new Date();
        sebulan.setDate(today.getDate() - 30);
        
        if (!startDateInput.value) {
            startDateInput.value = sebulan.toISOString().split('T')[0];
        }
        if (!endDateInput.value) {
            endDateInput.value = today.toISOString().split('T')[0];
        }
        
        rangeModal.classList.add('show');
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === rangeModal) {
            closeRangeModal();
        }
    });
}

function applyDateFilter() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Silakan pilih tanggal awal dan akhir');
        return;
    }

    if (startDate > endDate) {
        alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
        return;
    }

    const table = document.getElementById('attackLogsTable');
    if (!table) {
        console.error('Table not found');
        return;
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
    let visibleRows = 0;
    let hasNoDataRow = false;

    // Remove existing no data message if exists
    const existingNoData = tbody.querySelector('.no-data-row');
    if (existingNoData) {
        existingNoData.remove();
        hasNoDataRow = true;
    }

    // Store original display states
    const originalDisplayStates = new Map();
    rows.forEach(row => {
        originalDisplayStates.set(row, row.style.display);
    });

    // Filter rows based on date
    rows.forEach(row => {
        const dateCell = row.querySelector('[data-label="Log Time"]');
        if (dateCell) {
            const rowDate = new Date(dateCell.textContent.trim());
            if (rowDate >= startDate && rowDate <= endDate) {
                row.style.display = '';
                visibleRows++;
            } else {
                row.style.display = 'none';
            }
        }
    });

    // Show no data message if needed
    if (visibleRows === 0) {
        // Create no data message
        const noDataRow = document.createElement('tr');
        noDataRow.className = 'no-data-row';
        noDataRow.innerHTML = `
            <td colspan="11" style="text-align: center; padding: 20px;">
                <div class="alert alert-info" role="alert">
                    Tidak ada data untuk rentang tanggal yang dipilih
                    <button class="btn btn-link" onclick="resetDateFilter()">Reset Filter</button>
                </div>
            </td>
        `;
        tbody.appendChild(noDataRow);
    }

    closeRangeModal();
    initializePagination();
}

function resetDateFilter() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const table = document.getElementById('attackLogsTable');
    
    if (!table || !startDateInput || !endDateInput) {
        console.error('Required elements not found');
        return;
    }

    // Reset input dates
    startDateInput.value = '';
    endDateInput.value = '';
    
    // Show all rows
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr:not(.no-data-row)');
    
    // Remove no data message if exists
    const noDataRow = tbody.querySelector('.no-data-row');
    if (noDataRow) {
        noDataRow.remove();
    }
    
    // Show all data rows
    rows.forEach(row => {
        row.style.display = '';
    });
    
    closeRangeModal();
    initializePagination();
}

// Date Range Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const dateButton = document.querySelector('.date');
    const dateRangeModal = document.getElementById('dateRangeModal');
    const closeDateModal = document.getElementById('closeDateModal');
    const resetDateBtn = document.getElementById('resetDate');
    const applyDateBtn = document.getElementById('applyDate');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];

    // Show modal when date button is clicked
    dateButton.addEventListener('click', function() {
        dateRangeModal.classList.add('show');
    });

    // Close modal when close button is clicked
    closeDateModal.addEventListener('click', function() {
        dateRangeModal.classList.remove('show');
    });

    // Close modal when clicking outside
    dateRangeModal.addEventListener('click', function(e) {
        if (e.target === dateRangeModal) {
            dateRangeModal.classList.remove('show');
        }
    });

    // Reset dates
    resetDateBtn.addEventListener('click', function() {
        startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    });

    // Apply date filter
    applyDateBtn.addEventListener('click', function() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate > endDate) {
            alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
            return;
        }

        // Here you can add your date filtering logic
        // For example, filter table rows based on date range

        dateRangeModal.classList.remove('show');
    });
});

// Fungsi untuk menampilkan jam
function updateClock() {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const hours = String(wibTime.getUTCHours()).padStart(2, '0');
    const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(wibTime.getUTCSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
}

// Update jam setiap detik
setInterval(updateClock, 1000);
updateClock(); // Panggil sekali untuk menampilkan jam segera
