/* ============================================================
   ZERO BS GUIDE — Main JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile Nav ──────────────────────────────────────────────
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // ── Active Nav Link ─────────────────────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === currentPath || (currentPath.startsWith(linkPath) && linkPath !== '/')) {
      link.classList.add('active');
    }
  });

  // ── Intersection Observer Fade-In ───────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeEls.forEach(el => observer.observe(el));
  }

  // ── Contact Form ────────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic honeypot check
      const honey = contactForm.querySelector('.honey-field');
      if (honey && honey.value) return; // Bot detected

      const submitBtn = contactForm.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      const formData = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim()
      };

      // Client-side validation
      if (!formData.name || !formData.email || !formData.message) {
        showStatus('Please fill in all fields.', 'error');
        resetBtn();
        return;
      }

      if (!isValidEmail(formData.email)) {
        showStatus('Please enter a valid email address.', 'error');
        resetBtn();
        return;
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showStatus('✓ Message sent. We\'ll be in touch shortly.', 'success');
          contactForm.reset();
        } else {
          showStatus(data.message || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showStatus('Network error. Please try again or email us directly.', 'error');
      }

      resetBtn();

      function resetBtn() {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
    });
  }

  function showStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.className = `form-status ${type}`;
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ── Sanitize helper (XSS basic client-side) ─────────────────
  function sanitize(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

});
