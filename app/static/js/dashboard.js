document.querySelector('.hamburger').addEventListener('click', function() {
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
document.addEventListener('click', function(event) {
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

  rows.forEach(function(row) {
    var cols = row.querySelectorAll('td, th');
    var rowData = [];
    cols.forEach(function(col) {
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

  rows.forEach(function(row) {
    var cols = row.querySelectorAll('td, th');
    var rowData = [];
    cols.forEach(function(col) {
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
document.addEventListener('DOMContentLoaded', function() {
  const selectAllCheckbox = document.getElementById('select');
  
  if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', function() {
          const checkboxes = document.querySelectorAll('table tbody input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
              checkbox.checked = selectAllCheckbox.checked;
          });
      });
  }

  // Add event listeners for export buttons
  const exportButtons = document.querySelectorAll('.export-option');
  exportButtons.forEach(button => {
      button.addEventListener('click', function() {
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
      sortableHeader.addEventListener('click', function() {
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
                  'Low': 1
              };

              const comparison = severityOrder[severityA] - severityOrder[severityB];
              return isAscending ? comparison : -comparison;
          });

          // Reorder rows in DOM
          rows.forEach(row => tbody.appendChild(row));
      });
  }

  // Tambahkan event listener untuk tombol delete
  const deleteButtons = document.querySelectorAll('.fa-trash-alt');
  deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
          if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
              // Hapus baris tabel
              const row = this.closest('tr');
              row.remove();
          }
      });
  });
});
