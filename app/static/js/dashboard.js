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
    button.addEventListener('click', function () {
      if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        // Hapus baris tabel
        const row = this.closest('tr');
        row.remove();
      }
    });
  });
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
  handleFiles(this.files);
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

function deletePayload(id) {
  // Panggil endpoint untuk menghapus payload dari database
  fetch(`/delete-payload/${id}`, {
    method: 'DELETE'
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Hapus baris dari tabel
        const row = document.querySelector(`#payloadTable tbody tr[data-id="${id}"]`);
        if (row) {
          row.remove();
        }
      } else {
        alert('Failed to delete payload: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error deleting payload:', error);
    });
}