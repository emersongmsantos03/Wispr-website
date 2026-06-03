(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     NAV — shadow + shrink on scroll
  ───────────────────────────────────────────────────────── */
  function setupNavScroll() {
    var header = document.querySelector('.header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 12) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
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
     SCROLL REVEAL — [data-reveal] elements fade + slide up
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
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────
     SECTION REVEAL — stagger children of [data-reveal-section]
  ───────────────────────────────────────────────────────── */
  function setupSectionReveal() {
    var sections = document.querySelectorAll('[data-reveal-section]');
    if (!sections.length || !window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var section  = entry.target;
          var heading  = section.querySelector('h2, h3');
          var children = section.querySelectorAll(
            '.control-card, .how__col, .why-card, .groups__copy > *, .groups__visual, .mockup'
          );

          if (heading && !heading.hasAttribute('data-reveal')) {
            heading.classList.add('reveal-heading');
          }

          children.forEach(function (child, i) {
            child.style.transitionDelay = (i * 90) + 'ms';
            child.classList.add('reveal-child');
          });

          // Trigger on next frame so delay is set first
          requestAnimationFrame(function () {
            children.forEach(function (child) {
              child.classList.add('is-revealed');
            });
            if (heading && !heading.hasAttribute('data-reveal')) {
              heading.classList.add('is-revealed');
            }
          });

          observer.unobserve(section);
        }
      });
    }, { threshold: 0.08 });

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
     HERO PARALLAX — background shifts at 30% scroll speed
  ───────────────────────────────────────────────────────── */
  function setupParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    function onScroll() {
      if (window.scrollY > window.innerHeight) return;
      hero.style.setProperty('--parallax-y', (window.scrollY * 0.28) + 'px');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────
     COUNTER ANIMATION — [data-count] numbers count up
  ───────────────────────────────────────────────────────── */
  function animateCounter(el) {
    var raw    = el.getAttribute('data-count');
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var target = parseFloat(raw);
    var isFloat = raw.indexOf('.') !== -1;
    var duration = 1600;
    var start  = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var value    = target * eased;
      el.textContent = prefix + (isFloat ? value.toFixed(1) : Math.floor(value)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function setupCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length || !window.IntersectionObserver) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

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
    setupParallax();
    setupCounters();
    setupSmoothScroll();
    setupMockupPlayer();
    setupShowcaseTabs();
    setupLightbox();
    setupSamePageLinks();
  });

}());
