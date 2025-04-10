document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const serialModal = new bootstrap.Modal("#serialModal");
  const generateSerialBtn = document.getElementById("generateSerialBtn");
  const generateBtn = document.getElementById("generateBtn");
  const copyBtn = document.getElementById("copyBtn");
  const serialDisplay = document.getElementById("serialNumber");
  const purchaseCodeInput = document.getElementById("purchaseCode");
  const beliBtn = document.getElementById("beliBtn");

  // Event Listeners
  generateSerialBtn?.addEventListener("click", showSerialModal);
  generateBtn?.addEventListener("click", generateSerial);
  copyBtn?.addEventListener("click", copySerial);
  beliBtn?.addEventListener("click", handleActivation);
  purchaseCodeInput?.addEventListener("input", validateSerialInput);

  // Serial Modal Hidden Event
  document
    .getElementById("serialModal")
    ?.addEventListener("hidden.bs.modal", () => {
      const serial = serialDisplay.textContent;
      if (serial && !serial.includes("Click GENERATE")) {
        purchaseCodeInput.value = serial;
        validateSerial(serial);
      }
    });

  // Initial activation check
  checkActivationStatus();
});

// ================= CORE FUNCTIONS ================= //

function checkActivationStatus() {
  if (localStorage.getItem("featuresActivated") === "true") {
    enableAllFeatures();
    addDeactivateButton();
  } else {
    disableAllFeatures();
  }
}

function handleActivation(e) {
  e.preventDefault();
  const serial = document.getElementById("purchaseCode").value.trim();

  if (!serial) {
    showAlert("Harap masukkan nomor seri", "error");
    return;
  }

  if (validateSerial(serial)) {
    activateSystem();
    showAlert("Nomor seri diterima! Semua fitur sekarang aktif.", "success");
  } else {
    showAlert(
      "Nomor seri tidak valid. Harap generate nomor seri yang valid.",
      "error"
    );
  }
}

// ================= SYSTEM CONTROL ================= //

function activateSystem() {
  enableAllFeatures();
  localStorage.setItem("featuresActivated", "true");
  addDeactivateButton();
}

function deactivateSystem() {
  disableAllFeatures();
  localStorage.removeItem("featuresActivated");
  document.getElementById("purchaseCode").value = "";
  removeDeactivateButton();
  showAlert("Fitur dinonaktifkan", "warning");
}

// ================= FEATURE CONTROL ================= //

function enableAllFeatures() {
  // Enable protected content
  document.querySelectorAll(".protected-content").forEach((el) => {
    el.classList.remove("disabled");
  });

  // Enable form elements
  document
    .querySelectorAll(
      ".protected-content input, .protected-content button, .protected-content select"
    )
    .forEach((el) => {
      el.disabled = false;
    });

  // Enable module-specific features
  if (typeof enablePayloadFeatures === "function") enablePayloadFeatures();
  if (typeof enableExportFeatures === "function") enableExportFeatures();
  if (typeof enableSettingsFeatures === "function") enableSettingsFeatures();
}

function disableAllFeatures() {
  // Disable protected content
  document.querySelectorAll(".protected-content").forEach((el) => {
    el.classList.add("disabled");
  });

  // Disable form elements
  document
    .querySelectorAll(
      ".protected-content input, .protected-content button, .protected-content select"
    )
    .forEach((el) => {
      el.disabled = true;
    });

  // Disable module-specific features
  if (typeof disablePayloadFeatures === "function") disablePayloadFeatures();
  if (typeof disableExportFeatures === "function") disableExportFeatures();
  if (typeof disableSettingsFeatures === "function") disableSettingsFeatures();
}

// ================= UI HELPERS ================= //

function addDeactivateButton() {
  if (
    !document.getElementById("deactivateBtn") &&
    document.getElementById("buyForm")
  ) {
    const deactivateBtn = document.createElement("button");
    deactivateBtn.id = "deactivateBtn";
    deactivateBtn.className = "btn btn-danger mt-2";
    deactivateBtn.innerHTML = '<i class="fas fa-lock me-2"></i> Nonaktifkan';
    deactivateBtn.onclick = deactivateSystem;
    document.getElementById("buyForm").appendChild(deactivateBtn);
  }
}

function removeDeactivateButton() {
  const btn = document.getElementById("deactivateBtn");
  if (btn) btn.remove();
}

// ================= SERIAL GENERATION ================= //

let serialModalInstance;
function showSerialModal() {
  if (!serialModalInstance) {
    const modalEl = document.getElementById("serialModal");
    serialModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
  }
  serialModalInstance.show();
}

function generateSerial() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let serial = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) serial += "-";
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById("serialNumber").textContent = serial;
}

function copySerial() {
  const serial = document.getElementById("serialNumber").textContent;
  if (serial && !serial.includes("Click GENERATE")) {
    navigator.clipboard.writeText(serial).then(() => {
      const copyBtn = document.getElementById("copyBtn");
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check me-2"></i> TERSALIN!';
      setTimeout(() => (copyBtn.innerHTML = originalText), 2000);
    });
  }
}

// ================= VALIDATION ================= //

function validateSerial(serial) {
  return /^[A-Z0-9]{4}-?[A-Z0-9]{4}-?[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(serial);
}

function validateSerialInput() {
  const serial = this.value.trim();
  if (validateSerial(serial)) {
    this.classList.remove("is-invalid");
    this.classList.add("is-valid");
  } else {
    this.classList.remove("is-valid");
    this.classList.add("is-invalid");
  }
}

function showAlert(message, type) {
  // Replace with your preferred alert system (SweetAlert/Toast)
  const alertBox = document.createElement("div");
  alertBox.className = `alert alert-${type} fixed-top mx-auto mt-3`;
  alertBox.style.maxWidth = "500px";
  alertBox.style.zIndex = "1060";
  alertBox.textContent = message;
  document.body.appendChild(alertBox);

  setTimeout(() => alertBox.remove(), 3000);
}
