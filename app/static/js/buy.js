document.addEventListener('DOMContentLoaded', function() {
    const buyForm = document.getElementById('buyForm');
    
    buyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const purchaseCode = document.getElementById('purchaseCode').value;
        
        // Tambahkan logika pembelian di sini
        alert('Kode pembelian: ' + purchaseCode);
        
        // Reset form
        buyForm.reset();
    });

    // Modal handling dengan Bootstrap
    const guideButton = document.getElementById('guideButton');
    const guideModal = new bootstrap.Modal(document.getElementById('guideModal'));

    guideButton.addEventListener('click', function() {
        guideModal.show();
    });

    // Handle PDF generation
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    generatePdfBtn.addEventListener('click', function() {
        const modalContent = document.querySelector('.modal-body');
        
        // Configure PDF options
        const options = {
            margin: 1,
            filename: 'panduan-instalasi.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Generate PDF
        generatePdfBtn.disabled = true;
        generatePdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';

        html2pdf().from(modalContent).set(options).save()
            .then(() => {
                generatePdfBtn.disabled = false;
                generatePdfBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Generate PDF';
            })
            .catch(err => {
                console.error('Error generating PDF:', err);
                generatePdfBtn.disabled = false;
                generatePdfBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Generate PDF';
                alert('Gagal menghasilkan PDF. Silakan coba lagi.');
            });
    });
});
