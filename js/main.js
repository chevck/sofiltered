(function () {
  "use strict";

  /* Nav scroll state */
  const nav = document.querySelector(".site-nav");
  const floatBook = document.querySelector(".float-book");

  function onScroll() {
    const scrolled = window.scrollY > 40;
    if (nav) nav.classList.toggle("is-scrolled", scrolled);
    if (floatBook) floatBook.classList.toggle("is-visible", window.scrollY > 400);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mosaic rows drift in opposite directions on scroll */
  const mosaicRows = document.querySelectorAll(".mosaic-row");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (mosaicRows.length && !prefersReducedMotion) {
    let mosaicTicking = false;
    const updateMosaic = () => {
      const y = window.scrollY;
      mosaicRows.forEach((row, i) => {
        const direction = i % 2 === 0 ? 1 : -1;
        const offset = Math.max(-220, Math.min(220, y * 0.12 * direction));
        row.style.transform = `translateX(${offset}px)`;
      });
      mosaicTicking = false;
    };
    document.addEventListener(
      "scroll",
      () => {
        if (!mosaicTicking) {
          requestAnimationFrame(updateMosaic);
          mosaicTicking = true;
        }
      },
      { passive: true }
    );
    updateMosaic();
  }

  /* Typewriter — types, pauses, erases, moves to next label, loops */
  const typewriterEl = document.querySelector(".typewriter__text");
  if (typewriterEl) {
    const words = ["Content Creation", "Brand Identity", "Illustration"];
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pauseAfterType = 1400;
    const pauseAfterDelete = 300;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = words[wordIndex];
      if (!deleting) {
        charIndex++;
        typewriterEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        charIndex--;
        typewriterEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, pauseAfterDelete);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }
    tick();
  }

  /* Mobile nav toggle */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.innerHTML = isOpen ? '<i class="ri-close-line"></i>' : '<i class="ri-menu-line"></i>';
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        navToggle.innerHTML = '<i class="ri-menu-line"></i>';
      })
    );
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Testimonial carousel — real sliding track, N cards visible responsively */
  const testiViewport = document.querySelector(".testi-viewport");
  const testiTrack = document.querySelector(".testi-grid");
  const testiCards = document.querySelectorAll(".testi-card");
  const testiDotsWrap = document.querySelector(".testi-dots");

  if (testiViewport && testiTrack && testiCards.length) {
    let testiIndex = 0;

    function visibleCount() {
      return window.innerWidth <= 900 ? 1 : 3;
    }

    function maxIndex() {
      return Math.max(0, testiCards.length - visibleCount());
    }

    function buildDots() {
      if (!testiDotsWrap) return;
      testiDotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement("span");
        if (i === testiIndex) dot.classList.add("is-active");
        dot.addEventListener("click", () => goTo(i));
        testiDotsWrap.appendChild(dot);
      }
    }

    function render() {
      const cardWidth = testiCards[0].getBoundingClientRect().width;
      const gap = 24;
      const offset = testiIndex * (cardWidth + gap);
      testiTrack.style.transform = `translateX(-${offset}px)`;
      if (testiDotsWrap) {
        Array.from(testiDotsWrap.children).forEach((d, idx) =>
          d.classList.toggle("is-active", idx === testiIndex)
        );
      }
    }

    function goTo(i) {
      testiIndex = Math.max(0, Math.min(i, maxIndex()));
      render();
    }

    document.querySelectorAll(".testi-arrow").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.classList.contains("testi-arrow--next") ? 1 : -1;
        goTo(testiIndex + dir);
      });
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        testiIndex = Math.min(testiIndex, maxIndex());
        buildDots();
        render();
      }, 150);
    });

    buildDots();
    render();
  }

  /* Portfolio filter — animate cards out, swap display, animate matching cards in */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioCards = document.querySelectorAll(".portfolio-card");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;

      portfolioCards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        const wasHidden = card.dataset.hidden === "true";

        if (match) {
          if (wasHidden) {
            card.dataset.hidden = "false";
            if (reducedMotion) {
              card.classList.remove("is-hiding");
            } else {
              card.classList.add("is-hiding");
              requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("is-hiding")));
            }
          }
        } else if (!wasHidden) {
          if (reducedMotion) {
            card.dataset.hidden = "true";
          } else {
            card.classList.add("is-hiding");
            setTimeout(() => {
              card.dataset.hidden = "true";
            }, 280);
          }
        }
      });
    });
  });

  /* Contact form — client-side only feedback (no backend configured) */
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = contactForm.querySelector(".form-status");
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const required = contactForm.querySelectorAll("[required]");
      let valid = true;
      required.forEach((field) => {
        if (!field.value.trim()) valid = false;
      });

      const originalLabel = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending <i class="ri-loader-4-line spin"></i>';
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
        }
        if (!status) return;
        status.classList.remove("is-visible");
        status.className = "form-status " + (valid ? "is-success" : "is-error");
        status.textContent = valid
          ? "Thank you! Your inquiry has been submitted. We'll get back to you within 24 hours to discuss your project."
          : "Please fill in all required fields before submitting.";
        requestAnimationFrame(() => requestAnimationFrame(() => status.classList.add("is-visible")));
        if (valid) contactForm.reset();
      }, 550);
    });
  }

  /* Footer newsletter */
  const footerForm = document.querySelector(".footer-signup form");
  if (footerForm) {
    footerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = footerForm.querySelector("input");
      if (input) input.value = "";
      footerForm.querySelector("button").innerHTML = '<i class="ri-check-line"></i>';
    });
  }
})();
