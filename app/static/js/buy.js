document.addEventListener('DOMContentLoaded', function() {

    // Check if payment was successful and show button
    if (localStorage.getItem('paymentSuccess') === 'true') {
        const generateBtn = document.getElementById('generateSerialBtn');
        if (generateBtn) {
            generateBtn.style.display = 'inline-block';
            console.log('Button restored after page load');
        }
    }

    const buyForm = document.getElementById('buyForm');
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
    
    // Load Midtrans Snap
    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'Mid-client-a0Qdc090d4Z1OSXw');
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
            const serialButton = document.getElementById('generateSerialBtn');

            if (!submitButton || !checkoutButton || !proceedButton) {
                console.error('Required buttons not found');
                alert('Terjadi kesalahan sistem. Silakan muat ulang halaman.');
                return;
            }

            const originalSubmitText = submitButton.innerHTML;
            const originalCheckoutText = checkoutButton.innerHTML;
            const originalProceedText = proceedButton.innerHTML;
            const originalSerialText = serialButton ? serialButton.innerHTML : '<i class="fas fa-sync-alt me-2"></i> GENERATE';

            // Set loading state
            const setLoadingState = (loading) => {
                submitButton.disabled = loading;
                checkoutButton.disabled = loading;
                proceedButton.disabled = loading;
                
                // Add serial button to loading state
                if (serialButton) {
                    serialButton.disabled = loading;
                }
                
                if (loading) {
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                    checkoutButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                    proceedButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                    
                    // Serial button loading state
                    if (serialButton) {
                        serialButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
                    }
                } else {
                    submitButton.innerHTML = originalSubmitText;
                    checkoutButton.innerHTML = originalCheckoutText;
                    proceedButton.innerHTML = originalProceedText;
                    
                    // Serial button normal state
                    if (serialButton) {
                        serialButton.innerHTML = originalSerialText;
                    }
                }
            };

            setLoadingState(true);
            
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
            
            // Check if snap is loaded
            if (!window.snap) {
                throw new Error('Payment gateway not loaded. Please refresh the page.');
            }
            
            // Open Midtrans Snap popup with updated configuration
            window.snap.pay(data.snap_token, {
                onSuccess: function(result) {
                    console.log('Payment success:', result);
                    alert('Pembayaran berhasil! Order ID: ' + result.order_id);

                    buyForm.reset();
                    document.getElementById('customerDetailsForm').reset();
                    
                    const generateBtn = document.getElementById('generateSerialBtn');
                    if (generateBtn) {
                        generateBtn.style.display = 'inline-block';
                        // Save to localStorage before redirect
                        localStorage.setItem('paymentSuccess', 'true');
                        localStorage.setItem('orderID', result.order_id);
                    }
                    
                    setTimeout(() => {
                        window.location.href = '/buy';
                    }, 1500);
                },
                onPending: function(result) {
                    console.log('Payment pending:', result);
                    alert('Pembayaran dalam proses. Order ID: ' + result.order_id);
                    window.location.href = '/buy';
                },
                onError: function(result) {
                    console.error('Payment error:', result);
                    alert('Pembayaran gagal. Silakan coba lagi. Error: ' + (result.message || 'Unknown error'));
                    setLoadingState(false);
                },
                onClose: function() {
                    console.log('Customer closed the popup without finishing the payment');
                    setLoadingState(false);
                }
            });
            
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.message || 'An error occurred. Please try again.');
            setLoadingState(false);
            
            // Reset form if needed
            if (error.message.includes('not loaded')) {
                location.reload();
            }
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
        const modalContent = document.querySelector('.guideModalLabel');
        
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
