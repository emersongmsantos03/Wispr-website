(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     NAV — shadow + shrink on scroll
  ───────────────────────────────────────────────────────── */
  function setupNavScroll() {
    var header = document.querySelector('.header');
    if (!header) return;

    var logo       = document.getElementById('nav-logo');
    var isDarkHeader = document.body.classList.contains('blog-page');
    var STD_SRC    = 'images/wispr_navy.png';
    var WHITE_SRC  = 'images/wispr_logo_white.png';

    function onScroll() {
      var scrolled = window.scrollY > 12;
      header.classList.toggle('header--scrolled', scrolled);

      // Swap logo only for pages that use a dark/transparent header.
      if (logo) {
        var useWhite = isDarkHeader;
        logo.src = useWhite ? WHITE_SRC : STD_SRC;
        logo.style.filter = '';
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─────────────────────────────────────────────────────────
     MOBILE MENU — slide-down panel
  ───────────────────────────────────────────────────────── */
  function setupMobileMenu() {
    var toggle = document.querySelector('.nav__toggle');
    var links  = document.querySelector('.nav__links');
    var auth   = document.querySelector('.nav__auth');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.classList.toggle('is-open', !isOpen);
      if (links) links.classList.toggle('nav__links--open', !isOpen);
      if (auth)  auth.classList.toggle('nav__auth--open', !isOpen);
    });

    // Close menu when a nav link is clicked
    document.querySelectorAll('.nav__links a, .nav__auth a').forEach(function (a) {
      a.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('is-open');
        if (links) links.classList.remove('nav__links--open');
        if (auth)  auth.classList.remove('nav__auth--open');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     REVEAL HELPERS
  ───────────────────────────────────────────────────────── */

  // Wraps a heading in an overflow:hidden mask so the text
  // can slide up from below the visible edge (clip reveal).
  function wrapRevealMask(el) {
    if (!el || !el.parentNode) return;
    if (el.parentElement && el.parentElement.classList.contains('reveal-mask')) return;
    var mask = document.createElement('div');
    mask.className = 'reveal-mask';
    el.parentNode.insertBefore(mask, el);
    mask.appendChild(el);
    el.classList.add('reveal-type--text');
  }

  // True if any ancestor between el and stopAt has data-reveal.
  function hasRevealAncestor(el, stopAt) {
    var node = el.parentElement;
    while (node && node !== stopAt) {
      if (node.hasAttribute('data-reveal')) return true;
      node = node.parentElement;
    }
    return false;
  }

  /* ─────────────────────────────────────────────────────────
     SCROLL REVEAL — [data-reveal] elements
  ───────────────────────────────────────────────────────── */
  function setupReveal() {
    var elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length || !window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el    = entry.target;
          var delay = el.getAttribute('data-reveal-delay') || '0';
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('is-revealed');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION REVEAL — stagger children of [data-reveal-section]
  ───────────────────────────────────────────────────────── */
  function setupSectionReveal() {
    var sections = document.querySelectorAll('[data-reveal-section]');
    if (!sections.length || !window.IntersectionObserver) return;

    var CHILD_SELECTORS = [
      '.control-card',
      '.why-card',
      '.partners__title',
      '.partners__marquee',
      '.groups__copy > *',
      '.groups__visual',
      '.contact__eyebrow',
      '.contact__content > p',
      '.contact__methods',
      '.contact__form-card',
      '.control__heading > p',
      '.features__intro',
      '.features__reach',
      '.mockup'
    ].join(',');

    // Maps child type to its reveal direction
    function getRevealOrigin(child) {
      var cl = child.classList;
      if (cl.contains('why-card') || cl.contains('control-card')) return 'scale';
      if (cl.contains('groups__visual') || cl.contains('contact__form-card')) return 'right';
      if (cl.contains('partners__marquee')) return 'fade';
      var parent = child.parentElement;
      if (parent) {
        if (parent.classList.contains('groups__copy') ||
            parent.classList.contains('contact__content')) return 'left';
      }
      if (cl.contains('contact__eyebrow') || cl.contains('contact__methods')) return 'left';
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var section = entry.target;
        var heading = section.querySelector('h2, h3');

        var headingEl = (heading &&
                         !heading.hasAttribute('data-reveal') &&
                         !hasRevealAncestor(heading, section)) ? heading : null;

        // Capture children BEFORE DOM manipulation so selectors still match
        var children = Array.prototype.filter.call(
          section.querySelectorAll(CHILD_SELECTORS),
          function (el) {
            return el !== headingEl &&
                   !el.hasAttribute('data-reveal') &&
                   !el.classList.contains('reveal-mask') &&
                   !hasRevealAncestor(el, section);
          }
        );

        if (headingEl) {
          headingEl.style.transitionDelay = '0ms';
          headingEl.classList.add('reveal-heading');
        }

        // Assign origins and stagger delays
        // Children start 160ms after heading for a clear narrative rhythm
        var childBase = headingEl ? 160 : 0;
        children.forEach(function (child, i) {
          var origin = getRevealOrigin(child);
          if (origin) child.setAttribute('data-reveal-origin', origin);
          child.style.transitionDelay = (childBase + i * 80) + 'ms';
          child.classList.add('reveal-child');
        });

        // Single rAF — browser paints initial state first, then transition fires
        requestAnimationFrame(function () {
          if (headingEl) headingEl.classList.add('is-revealed');
          children.forEach(function (child) { child.classList.add('is-revealed'); });
        });

        observer.unobserve(section);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ─────────────────────────────────────────────────────────
     CARD SPOTLIGHT — subtle light follows cursor
  ───────────────────────────────────────────────────────── */
  function setupSpotlight() {
    var cards = document.querySelectorAll('.why-card, .control-card');

    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var x    = ((e.clientX - rect.left) / rect.width)  * 100;
        var y    = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--spotlight-x', x + '%');
        card.style.setProperty('--spotlight-y', y + '%');
        card.classList.add('has-spotlight');
      });

      card.addEventListener('pointerleave', function () {
        card.classList.remove('has-spotlight');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     COUNTER ANIMATION — [data-count] numbers count up
  ───────────────────────────────────────────────────────── */
  function setupPartnerMarquee() {
    var marquee = document.querySelector('.partners__marquee');
    var track   = document.querySelector('.partners__track');
    var set     = document.querySelector('.partners__set');
    if (!marquee || !track || !set) return;

    var cycleWidth = 0;
    var x = 0;
    var lastTs = null;
    var isDragging = false;
    var pointerId = null;
    var startPointerX = 0;
    var startTrackX = 0;
    var pixelsPerSecond = 80;

    function normalize(value) {
      if (!cycleWidth) return value;
      value = value % cycleWidth;
      if (value > 0) value -= cycleWidth;
      return value;
    }

    function render() {
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
    }

    function measure() {
      cycleWidth = set.getBoundingClientRect().width || 0;
      if (!cycleWidth) return;
      pixelsPerSecond = cycleWidth / 34;
      x = normalize(x);
      render();
    }

    function tick(ts) {
      if (lastTs === null) lastTs = ts;
      var dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (!isDragging) {
        x = normalize(x - (pixelsPerSecond * dt));
        render();
      }

      requestAnimationFrame(tick);
    }

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      pointerId = e.pointerId;
      startPointerX = e.clientX;
      startTrackX = x;
      lastTs = null;
      marquee.classList.add('is-dragging');
      if (marquee.setPointerCapture) marquee.setPointerCapture(pointerId);
      if (e.pointerType === 'mouse') e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDragging || e.pointerId !== pointerId) return;
      x = normalize(startTrackX + (e.clientX - startPointerX));
      render();
    }

    function stopDragging(e) {
      if (!isDragging || (e && e.pointerId !== pointerId)) return;
      isDragging = false;
      pointerId = null;
      lastTs = null;
      marquee.classList.remove('is-dragging');
    }

    track.style.animation = 'none';
    measure();
    requestAnimationFrame(tick);

    marquee.addEventListener('pointerdown', onPointerDown);
    marquee.addEventListener('pointermove', onPointerMove);
    marquee.addEventListener('pointerup', stopDragging);
    marquee.addEventListener('pointercancel', stopDragging);
    marquee.addEventListener('lostpointercapture', stopDragging);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
  }

  function animateCounter(el) {
    var raw      = el.getAttribute('data-count');
    var suffix   = el.getAttribute('data-suffix') || '';
    var prefix   = el.getAttribute('data-prefix') || '';
    var target   = parseFloat(raw);
    var isFloat  = raw.indexOf('.') !== -1;
    var duration = 1800;
    var start    = null;

    function fmt(n) {
      if (isFloat) return n.toFixed(1);
      return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 4); // ease-out quart — faster start, dramatic finish
      el.textContent = prefix + fmt(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function setupCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length || !window.IntersectionObserver) return;

    // Low threshold so counters start in sync with the reveal fade-in
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    counters.forEach(function (c) { observer.observe(c); });
  }

  /* ─────────────────────────────────────────────────────────
     SMOOTH ANCHOR SCROLL — override default jump for #links
  ───────────────────────────────────────────────────────── */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id     = a.getAttribute('href');
        var target = id === '#' ? null : document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var headerH = (document.querySelector('.header') || {}).offsetHeight || 70;
        var top     = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     MOCKUP PROGRESS BAR — animates when mockup enters view
  ───────────────────────────────────────────────────────── */
  function setupMockupPlayer() {
    var fill = document.querySelector('.mockup__progress-fill');
    if (!fill || !window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        fill.style.transition = 'width 3.5s cubic-bezier(.4,0,.2,1) 0.6s';
        fill.style.width = '72%';
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(fill);
  }

  /* ─────────────────────────────────────────────────────────
     SHOWCASE TABS
  ───────────────────────────────────────────────────────── */
  function setupShowcaseTabs() {
    var tabs   = document.querySelectorAll('.showcase__tab');
    var panels = document.querySelectorAll('.showcase__panel');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.getAttribute('data-tab'), 10);

        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(function (p) { p.classList.remove('is-active'); });

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        var target = document.querySelector('.showcase__panel[data-panel="' + idx + '"]');
        if (target) target.classList.add('is-active');
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     SAME-PAGE NAV — scroll to top instead of reloading
  ───────────────────────────────────────────────────────── */
  function setupSamePageLinks() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.getAttribute('href') === currentPage) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     LIGHTBOX — click screenshot to view full size
  ───────────────────────────────────────────────────────── */
  function formatPhone(value) {
    var digits = value.replace(/\D/g, '').slice(0, 10);

    if (digits.length <= 3) {
      return digits ? '(' + digits : '';
    }

    if (digits.length <= 6) {
      return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
    }

    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }

  function setupPhoneMask() {
    document.querySelectorAll('[data-phone]').forEach(function (input) {
      input.addEventListener('input', function () {
        input.value = formatPhone(input.value);
      });
    });
  }

  var _lastFocused = null;

  function openModal(modal) {
    if (!modal) return;
    _lastFocused = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var closeBtn = modal.querySelector('[data-modal-close]');
      if (closeBtn) closeBtn.focus();
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    window.setTimeout(function () {
      modal.hidden = true;
      if (_lastFocused && typeof _lastFocused.focus === 'function') _lastFocused.focus();
    }, 200);
  }

  function setupModal() {
    var modal = document.querySelector('[data-modal]');
    if (!modal) return;
    modal.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(modal); });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal(modal);
    });
  }

  function setupLeadForm() {
    var form  = document.querySelector('[data-lead-form]');
    var modal = document.querySelector('[data-modal]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      var submitButton = form.querySelector('button[type="submit"]');
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      }

      openModal(modal);

      window.setTimeout(function () {
        form.submit();
      }, 80);

      window.setTimeout(function () {
        form.reset();
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('is-loading');
        }
      }, 700);
    });
  }

  function setupLightbox() {
    var box   = document.getElementById('lightbox');
    var img   = document.getElementById('lightboxImg');
    var close = document.getElementById('lightboxClose');
    if (!box || !img) return;

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      close.focus();
    }

    function closeLightbox() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      img.src = '';
    }

    document.querySelectorAll('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () {
        open(el.src, el.alt);
      });
    });

    close.addEventListener('click', closeLightbox);

    box.addEventListener('click', function (e) {
      if (e.target === box) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) closeLightbox();
    });
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.add('js');
    setupNavScroll();
    setupMobileMenu();
    setupReveal();
    setupSectionReveal();
    setupSpotlight();
    setupPartnerMarquee();
    setupCounters();
    setupSmoothScroll();
    setupMockupPlayer();
    setupShowcaseTabs();
    setupLightbox();
    setupSamePageLinks();
    setupPhoneMask();
    setupModal();
    setupLeadForm();
    setupLazyImages();
  });

  /* ─────────────────────────────────────────────────────────
     LAZY IMAGE FADE — images fade in once loaded
  ───────────────────────────────────────────────────────── */
  function setupLazyImages() {
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('loaded'); });
      }
    });
  }

}());
