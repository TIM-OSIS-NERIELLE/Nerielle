// URL Web App dari Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbxFLQomTaOIiRtzssbP5vNiMzCY9bdITIPmKFEMw3uX6895vbedsYdVp__LweTVzn0f/exec';

// FUNGSI UTAMA MODAL
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('closingEvent');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('closingEvent');
        document.body.style.overflow = 'auto';
    }
};

// MENGAMBIL JUMLAH PESERTA REALTIME DARI SPREADSHEET
function fetchRegistrantCount() {
    const quotaText = document.getElementById('quotaText');
    if (!quotaText) return;

    fetch(scriptURL)
        .then(response => response.json())
        .then(data => {
            if (data && typeof data.count === 'number') {
                quotaText.textContent = `${data.count} Siswa Terdaftar`;
            } else {
                quotaText.textContent = `0 Siswa Terdaftar`;
            }
        })
        .catch(error => {
            console.error('Gagal mengambil data pendaftar:', error);
            quotaText.textContent = `0 Siswa Terdaftar`;
        });
}

// HANDLER SUBMIT FORM DENGAN VALIDASI & PURIFIKASI DATA
window.handleFormSubmit = function(event) {
    event.preventDefault();
    
    const form = document.forms['google-sheet'];
    const submitBtn = document.getElementById('btnSubmitForm');
    const rawFullname = document.getElementById('fullname')?.value || '';
    const kelas = document.getElementById('kelas')?.value;

    // 1. Clean & Trim Input
    const fullname = rawFullname.trim().replace(/\s+/g, ' ');

    // 2. Validasi Input Kritis
    if (!fullname || !kelas) {
        alert('Mohon isi nama lengkap dan kelas!');
        return;
    }

    const nameRegex = /^[a-zA-Z\s'.]{3,50}$/;
    if (!nameRegex.test(fullname)) {
        alert('Mohon masukkan nama lengkap yang valid (minimal 3 huruf, tanpa angka/simbol aneh).');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim Data...';
    }

    // 3. Konversi Nama ke Title Case
    const formattedName = fullname.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());

    fetch(scriptURL, { 
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
            fullname: formattedName,
            kelas: kelas
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'duplicate' || data.result === 'error') {
            alert(data.message || 'Nama Anda sudah terdaftar sebelumnya!');
            return;
        }

        window.closeModal('modalDaftar');

        const msgText = document.getElementById('successMessageText');
        if (msgText) {
            msgText.innerHTML = `Terima kasih <strong>${formattedName}</strong> (${kelas})!<br>Pendaftaran Anda telah berhasil disimpan di sistem. Silakan unduh Surat Izin Orang Tua.`;
        }
        window.openModal('modalSukses');

        fetchRegistrantCount();
        if (form) form.reset();
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>KIRIM PENDAFTARAN</span>';
        }
    });
};

// HANDLER CEK STATUS PENDAFTARAN
window.handleCheckStatus = function(event) {
    event.preventDefault();

    const fullname = document.getElementById('checkFullname')?.value.trim();
    const kelas = document.getElementById('checkKelas')?.value;
    const resultBox = document.getElementById('statusResultBox');
    const btnCheck = document.getElementById('btnCheckStatus');

    if (!fullname || !kelas) return;

    btnCheck.disabled = true;
    btnCheck.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa Data...';
    resultBox.style.display = 'none';

    fetch(`${scriptURL}?action=checkStatus&fullname=${encodeURIComponent(fullname)}&kelas=${encodeURIComponent(kelas)}`)
        .then(response => response.json())
        .then(data => {
            resultBox.style.display = 'block';
            if (data.status === 'registered') {
                resultBox.style.borderColor = '#a6fff8';
                resultBox.innerHTML = `
                    <div class="status-badge-verified">
                        <i class="fa-solid fa-circle-check"></i> TERDAFTAR
                    </div>
                    <p class="status-detail-text">
                        Halo <strong>${fullname}</strong> (${kelas}), data pendaftaran Anda <strong>sudah terdaftar resmi</strong> dalam sistem.
                    </p>
                `;
            } else {
                resultBox.style.borderColor = '#ff4d4d';
                resultBox.innerHTML = `
                    <div class="status-badge-verified status-badge-error">
                        <i class="fa-solid fa-circle-xmark"></i> BELUM TERDAFTAR
                    </div>
                    <p class="status-detail-text">
                        Data atas nama <strong>${fullname}</strong> (${kelas}) belum ditemukan. Silakan isi form pendaftaran terlebih dahulu.
                    </p>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memeriksa data. Silakan coba lagi.');
        })
        .finally(() => {
            btnCheck.disabled = false;
            btnCheck.innerHTML = '<span>CEK STATUS</span>';
        });
};

// EVENT LISTENER LOAD
document.addEventListener('DOMContentLoaded', () => {

    // 1. Ambil Jumlah Pendaftar Real-time
    fetchRegistrantCount();

    // 2. Autoplay Video Banner
    const bannerVideo = document.getElementById('bannerVideo');
    if (bannerVideo) {
        bannerVideo.muted = true;
        bannerVideo.play().catch(e => console.log("Autoplay handled:", e));
    }

    // 3. Hamburger Menu Mobile
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => navMenu.classList.toggle('active'));
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('active'));
        });
    }

    // 4. FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) item.classList.remove('active');
            });
            faqItem.classList.toggle('active');
        });
    });

    // 5. Hitung Mundur Event
    const targetDate = new Date('April 9, 2027 00:00:00').getTime();
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (document.getElementById('days')) document.getElementById('days').innerText = days < 10 ? '0' + days : days;
            if (document.getElementById('hours')) document.getElementById('hours').innerText = hours < 10 ? '0' + hours : hours;
            if (document.getElementById('minutes')) document.getElementById('minutes').innerText = minutes < 10 ? '0' + minutes : minutes;
            if (document.getElementById('seconds')) document.getElementById('seconds').innerText = seconds < 10 ? '0' + seconds : seconds;
        }
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 6. Tutup Modal saat Klik Luar Card
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.add('closingEvent');
            document.body.style.overflow = 'auto';
        }
    });
});