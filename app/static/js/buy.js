document.addEventListener('DOMContentLoaded', function() {
    const buyForm = document.getElementById('buyForm');
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
    
    // Load Midtrans Snap
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-wIfFBYFIMYaIP1cG');
    document.head.appendChild(script);

    // Function to handle payment
    async function handlePayment() {
        try {
            // Get reCAPTCHA response
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                alert('Mohon selesaikan verifikasi CAPTCHA terlebih dahulu');
                return;
            }

            // Show loading state
            const submitButton = buyForm.querySelector('button[type="submit"]');
            const checkoutButton = buyForm.querySelector('button[type="button"]');
            const proceedButton = document.getElementById('proceedToPayment');
            const originalSubmitText = submitButton.innerHTML;
            const originalCheckoutText = checkoutButton.innerHTML;
            const originalProceedText = proceedButton.innerHTML;
            
            submitButton.disabled = true;
            checkoutButton.disabled = true;
            proceedButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            checkoutButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            proceedButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            
            // Get form data
            const customerName = document.getElementById('customerName').value;
            const customerEmail = document.getElementById('customerEmail').value;
            const customerPhone = document.getElementById('customerPhone').value;
            
            // Create payment
            const response = await fetch('/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'customerName': customerName,
                    'customerEmail': customerEmail,
                    'customerPhone': customerPhone,
                    'g-recaptcha-response': recaptchaResponse
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment');
            }
            
            // Close the customer details modal
            customerDetailsModal.hide();
            
            // Reset reCAPTCHA
            grecaptcha.reset();
            
            // Open Midtrans Snap popup
            window.snap.pay(data.snap_token, {
                onSuccess: function(result) {
                    // Handle successful payment
                    alert('Payment successful!');
                    buyForm.reset();
                    document.getElementById('customerDetailsForm').reset();
                },
                onPending: function(result) {
                    // Handle pending payment
                    alert('Payment is pending. Please complete your payment.');
                },
                onError: function(result) {
                    // Handle payment error
                    alert('Payment failed. Please try again.');
                },
                onClose: function() {
                    // Handle when customer closes the popup
                    submitButton.disabled = false;
                    checkoutButton.disabled = false;
                    proceedButton.disabled = false;
                    submitButton.innerHTML = originalSubmitText;
                    checkoutButton.innerHTML = originalCheckoutText;
                    proceedButton.innerHTML = originalProceedText;
                }
            });
            
        } catch (error) {
            alert(error.message || 'An error occurred. Please try again.');
            submitButton.disabled = false;
            checkoutButton.disabled = false;
            proceedButton.disabled = false;
            submitButton.innerHTML = originalSubmitText;
            checkoutButton.innerHTML = originalCheckoutText;
            proceedButton.innerHTML = originalProceedText;
        }
    }
    
    // Handle Buy button
    buyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        customerDetailsModal.show();
    });

    // Handle Checkout button
    const checkoutButton = buyForm.querySelector('button[type="button"]');
    checkoutButton.addEventListener('click', function() {
        customerDetailsModal.show();
    });

    // Handle Proceed to Payment button in customer details modal
    const proceedButton = document.getElementById('proceedToPayment');
    proceedButton.addEventListener('click', async function() {
        const customerDetailsForm = document.getElementById('customerDetailsForm');
        if (customerDetailsForm.checkValidity()) {
            await handlePayment();
        } else {
            customerDetailsForm.reportValidity();
        }
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
