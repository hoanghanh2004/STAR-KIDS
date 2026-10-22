/**
 * NGÔI SAO NHÍ VIỆT NAM 2026 — STARKIDS VIETNAM 2026
 * Form Validation & Real-time Google Sheets Sync
 * Principles:
 *  - Client-side validation: Required fields, VN phone format, Child age (3-11), Bracket selection
 *  - Real-time Google Sheets Integration via Google Apps Script Web App
 *  - Instant submission feedback with modal verification & Zalo follow-up
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgWzrpsqH5G9h-HmwO8lksr_5CmhqRYqL8ehYr5NEQr2MN7zGOpG2DuFcbGPMMGRHz/exec';

document.addEventListener('DOMContentLoaded', () => {
  initRegistrationForm();
  initDemoModal();
});

/**
 * 1. Form Validation & Submission Handler
 */
function initRegistrationForm() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  const parentName = document.getElementById('parent-name');
  const parentPhone = document.getElementById('parent-phone');
  const parentEmail = document.getElementById('parent-email');
  const childName = document.getElementById('child-name');
  const childAge = document.getElementById('child-age');
  const childBracket = document.getElementById('child-bracket');
  const consentCheck = document.getElementById('parent-consent');

  // Tự động gợi ý bảng thi khi phụ huynh nhập số tuổi
  if (childAge && childBracket) {
    childAge.addEventListener('input', () => {
      const age = parseInt(childAge.value, 10);
      if (!isNaN(age)) {
        if (age >= 3 && age <= 5) {
          childBracket.value = 'Bảng A (3–5 tuổi)';
        } else if (age >= 6 && age <= 11) {
          childBracket.value = 'Bảng B (6–11 tuổi)';
        }
      }
      validateAgeField(childAge);
    });
  }

  // Realtime validation khi người dùng nhập liệu
  [parentName, parentPhone, parentEmail, childName, childBracket].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => validateField(input));
    input.addEventListener('change', () => validateField(input));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isFormValid = true;
    let firstInvalidInput = null;

    // 1. Kiểm tra họ tên phụ huynh
    if (!validateField(parentName)) {
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || parentName;
    }

    // 2. Kiểm tra SĐT liên hệ
    if (!validateField(parentPhone)) {
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || parentPhone;
    }

    // 3. Kiểm tra email (nếu có nhập)
    if (parentEmail && parentEmail.value.trim() !== '') {
      if (!validateEmailField(parentEmail)) {
        isFormValid = false;
        firstInvalidInput = firstInvalidInput || parentEmail;
      }
    }

    // 4. Kiểm tra tên bé
    if (!validateField(childName)) {
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || childName;
    }

    // 5. Kiểm tra tuổi của bé (3 - 11 tuổi)
    if (!validateAgeField(childAge)) {
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || childAge;
    }

    // 6. Kiểm tra bảng thi
    if (!validateField(childBracket)) {
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || childBracket;
    }

    // 7. Kiểm tra cam kết của phụ huynh
    const consentError = document.getElementById('error-consent');
    if (consentCheck && !consentCheck.checked) {
      if (consentError) consentError.classList.add('is-visible');
      isFormValid = false;
      firstInvalidInput = firstInvalidInput || consentCheck;
    } else {
      if (consentError) consentError.classList.remove('is-visible');
    }

    if (!isFormValid) {
      if (firstInvalidInput) {
        firstInvalidInput.focus();
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Thu thập dữ liệu đăng ký
    const parentCity = document.getElementById('parent-city')?.value.trim() || 'Chưa cung cấp';
    const notes = document.getElementById('registration-notes')?.value.trim() || 'Không có';
    const driveLink = document.getElementById('drive-link')?.value.trim() || 'Chưa cung cấp (Gửi qua Zalo)';

    const payload = {
      parentName: parentName.value.trim(),
      parentPhone: parentPhone.value.trim(),
      parentEmail: parentEmail?.value.trim() || 'Không cung cấp',
      parentCity: parentCity,
      childName: childName.value.trim(),
      childAge: childAge.value.trim(),
      childBracket: childBracket.value,
      driveLink: driveLink,
      notes: notes,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-animation" style="display:inline-block; vertical-align:middle; margin-right:8px;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        ĐANG GỬI HỒ SƠ...
      `;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      showSubmissionNoticeModal(payload, true);
      form.reset();
    } catch (err) {
      console.warn('Google Sheets sync notice:', err);
      // Vẫn hiển thị modal để phụ huynh sao chép hoặc gửi qua Zalo nếu mạng yếu
      showSubmissionNoticeModal(payload, false);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
}

/**
 * 2. Validate trường dữ liệu đơn lẻ
 */
function validateField(input) {
  if (!input) return true;
  const errorEl = document.getElementById(`error-${input.id}`);
  let isValid = true;
  let message = '';

  const value = input.value.trim();

  if (input.required && !value) {
    isValid = false;
    message = 'Vui lòng không để trống trường này.';
  } else if (input.id === 'parent-phone') {
    // Định dạng số điện thoại Việt Nam (10 chữ số, đầu số di động hợp lệ)
    const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      message = 'Vui lòng nhập số điện thoại hợp lệ (10 chữ số, ví dụ: 0938808886).';
    }
  }

  if (!isValid) {
    input.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
  } else {
    input.classList.remove('has-error');
    if (errorEl) {
      errorEl.classList.remove('is-visible');
    }
  }

  return isValid;
}

/**
 * 3. Validate tuổi thí sinh (3 đến 11 tuổi)
 */
function validateAgeField(input) {
  if (!input) return true;
  const errorEl = document.getElementById(`error-${input.id}`);
  const val = parseInt(input.value, 10);

  if (isNaN(val)) {
    input.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = 'Vui lòng nhập độ tuổi của bé (từ 3 đến 11 tuổi).';
      errorEl.classList.add('is-visible');
    }
    return false;
  }

  if (val < 3 || val > 11) {
    input.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = `Bé ${val} tuổi không thuộc đối tượng dự thi (Độ tuổi hợp lệ: 3 đến 11 tuổi).`;
      errorEl.classList.add('is-visible');
    }
    return false;
  }

  input.classList.remove('has-error');
  if (errorEl) errorEl.classList.remove('is-visible');
  return true;
}

/**
 * 4. Validate Email tùy chọn
 */
function validateEmailField(input) {
  const errorEl = document.getElementById(`error-${input.id}`);
  const value = input.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (value && !emailRegex.test(value)) {
    input.classList.add('has-error');
    if (errorEl) {
      errorEl.textContent = 'Định dạng email không hợp lệ.';
      errorEl.classList.add('is-visible');
    }
    return false;
  }

  input.classList.remove('has-error');
  if (errorEl) errorEl.classList.remove('is-visible');
  return true;
}

/**
 * 5. Transparent Submission Notice Modal
 */
function initDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (!modal) return;

  const closeBtns = modal.querySelectorAll('[data-dismiss="modal"]');
  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    });
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  });

  // Sao chép nội dung tóm tắt để gửi qua Zalo hoặc Email
  const copyBtn = document.getElementById('btn-copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const summaryText = document.getElementById('modal-summary-content')?.innerText || '';
      if (summaryText && navigator.clipboard) {
        navigator.clipboard.writeText(summaryText).then(() => {
          copyBtn.textContent = '✓ Đã sao chép vào bộ nhớ đệm!';
          setTimeout(() => {
            copyBtn.textContent = 'Sao chép thông tin hồ sơ';
          }, 2500);
        });
      }
    });
  }
}

function showSubmissionNoticeModal(data, isOnlineSuccess = true) {
  const modal = document.getElementById('demo-modal');
  const summaryBox = document.getElementById('modal-summary-content');
  const alertBox = document.getElementById('modal-alert-notice');
  if (!modal || !summaryBox) return;

  if (alertBox) {
    if (isOnlineSuccess) {
      alertBox.className = 'modal-alert-notice modal-alert-success';
      alertBox.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #059669; flex-shrink: 0; margin-top: 2px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div>
          <strong style="color: #065F46; font-size: 0.95rem;">ĐĂNG KÝ THÀNH CÔNG!</strong><br>
          Hồ sơ đăng ký của bé đã được chuyển trực tiếp vào hệ thống dữ liệu của Ban tổ chức. Phụ huynh vui lòng gửi thêm 3 ảnh của bé qua Zalo để hoàn thiện hồ sơ dự thi.
        </div>
      `;
    } else {
      alertBox.className = 'modal-alert-notice';
      alertBox.innerHTML = `
        <div>
          <strong>Thông báo tiếp nhận:</strong> Thông tin của bạn đã được ghi nhận. Vui lòng bấm nút "Gửi Qua Zalo" bên dưới để hoàn tất xác nhận hồ sơ với Ban tổ chức.
        </div>
      `;
    }
  }

  summaryBox.innerHTML = `
    <strong>[THÔNG TIN ĐĂNG KÝ — NGÔI SAO NHÍ VIỆT NAM 2026]</strong><br>
    • Họ tên phụ huynh/giám hộ: <strong>${escapeHtml(data.parentName)}</strong><br>
    • Số điện thoại (Zalo): <strong>${escapeHtml(data.parentPhone)}</strong><br>
    • Email liên hệ: <strong>${escapeHtml(data.parentEmail)}</strong><br>
    • Tỉnh / Thành phố: <strong>${escapeHtml(data.parentCity)}</strong><br>
    --------------------------------------------------<br>
    • Họ tên thí sinh: <strong>${escapeHtml(data.childName)}</strong><br>
    • Tuổi của bé: <strong>${escapeHtml(data.childAge)} tuổi</strong><br>
    • Bảng thi: <strong>${escapeHtml(data.childBracket)}</strong><br>
    • Link Google Drive: <strong>${escapeHtml(data.driveLink)}</strong><br>
    • Ghi chú / Nguyện vọng: <em>${escapeHtml(data.notes)}</em>
  `;

  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden';
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}
