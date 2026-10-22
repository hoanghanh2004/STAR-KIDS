/**
 * NGÔI SAO NHÍ VIỆT NAM 2026 — STARKIDS VIETNAM 2026
 * Main Application Logic: Navigation, ScrollSpy, Lightbox Modal & Smooth Scroll
 * Architecture: Clean Vanilla JavaScript (ES6+), No External Libraries
 */

// Cấu hình URL Zalo chính thức của Ban tổ chức (Nhà báo Duy Mạnh - 0938 808 886)
const ZALO_OFFICIAL_URL = 'https://zalo.me/0938808886';

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNavigation();
  initScrollSpy();
  initScrollReveal();
  initPosterLightbox();
  initBackToTop();
  initSmoothScrollOffsets();
});

/**
 * 1. Sticky Header with Dynamic Backdrop
 */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * 2. Mobile Navigation Drawer & Accessibility
 */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : toggleBtn.getAttribute('aria-expanded') !== 'true';
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  const drawerLinks = drawer.querySelectorAll('.nav-link, .btn');
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('is-open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}

/**
 * 3. Scroll Reveal via Native IntersectionObserver
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.1,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => revealObserver.observe(el));
}

/**
 * 4. Official Poster Lightbox Modal (Xem lớn, giữ nguyên tỷ lệ, đóng bằng nút & Escape)
 */
function initPosterLightbox() {
  const triggers = document.querySelectorAll('[data-action="open-poster-lightbox"]');
  const modal = document.getElementById('poster-lightbox-modal');
  if (!modal) return;

  const openLightbox = () => {
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox();
    });
    // Hỗ trợ truy cập bằng bàn phím (Enter / Space)
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox();
      }
    });
  });

  const closeButtons = modal.querySelectorAll('[data-dismiss="lightbox"]');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', closeLightbox);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('lightbox-dialog')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}

/**
 * 5. ScrollSpy Navigation Tracker
 * Tự động highlight mục menu tương ứng khi cuộn trang
 * Hỗ trợ chuyển active ngay lập tức khi click
 */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-desktop .nav-link, .mobile-nav-drawer .nav-link');
  if (!navLinks.length) return;

  // Lấy danh sách các section mục tiêu từ thuộc tính href của các liên kết menu
  const targetSections = [];
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#') && href.length > 1) {
      const sec = document.querySelector(href);
      if (sec && !targetSections.includes(sec)) {
        targetSections.push(sec);
      }
    }
  });

  if (!targetSections.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${id}`) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  };

  let isClickScrolling = false;
  let clickTimeout = null;

  const handleScrollSpy = () => {
    if (isClickScrolling) return;

    const scrollY = window.scrollY;
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 80;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 1. Ở vị trí đầu trang -> Kích hoạt menu Trang Chủ
    if (scrollY < 120) {
      setActive('hero');
      return;
    }

    // 2. Khi cuộn gần tới đáy trang -> Kích hoạt mục menu cuối cùng (Liên Hệ)
    if (windowHeight + scrollY >= documentHeight - 60) {
      const lastSection = targetSections[targetSections.length - 1];
      if (lastSection) setActive(lastSection.id);
      return;
    }

    // 3. Quét vị trí các section để kích hoạt mục đang hiển thị
    const checkPoint = scrollY + headerHeight + (windowHeight * 0.25);
    let activeId = targetSections[0].id;

    for (let i = 0; i < targetSections.length; i++) {
      const sec = targetSections[i];
      const secTop = sec.getBoundingClientRect().top + scrollY;
      if (checkPoint >= secTop) {
        activeId = sec.id;
      }
    }

    setActive(activeId);
  };

  window.addEventListener('scroll', handleScrollSpy, { passive: true });
  handleScrollSpy();

  // Khi click vào từng menu: Chuyển active ngay lập tức & tạm hoãn spy trong thời gian cuộn
  navLinks.forEach((link) => {
    link.addEventListener('click', function () {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.slice(1);
        isClickScrolling = true;
        setActive(id);

        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
          isClickScrolling = false;
          handleScrollSpy();
        }, 850);
      }
    });
  });
}

/**
 * 6. Back to Top Button
 */
function initBackToTop() {
  const backBtn = document.querySelector('.btn-back-to-top');
  if (!backBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 450) {
      backBtn.classList.add('is-visible');
    } else {
      backBtn.classList.remove('is-visible');
    }
  }, { passive: true });

  backBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

/**
 * 7. Smooth Scroll Offsets for Fixed Header
 */
function initSmoothScrollOffsets() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
        const targetPosition = (targetId === '#hero')
          ? 0
          : targetElement.getBoundingClientRect().top + window.scrollY - headerHeight + 1;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}
