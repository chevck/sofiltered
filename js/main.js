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
  if (mosaicRows.length) {
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

  /* Testimonial carousel (dots only — grid already shows 3 at a time on desktop) */
  const dots = document.querySelectorAll(".testi-dots span");
  const testiGrid = document.querySelector(".testi-grid");
  let testiIndex = 0;
  function setTesti(i) {
    testiIndex = i;
    dots.forEach((d, idx) => d.classList.toggle("is-active", idx === i));
  }
  document.querySelectorAll(".testi-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.classList.contains("testi-arrow--next") ? 1 : -1;
      const next = (testiIndex + dir + dots.length) % dots.length;
      setTesti(next);
      if (testiGrid) {
        testiGrid.style.transition = "opacity 0.3s ease";
        testiGrid.style.opacity = "0.3";
        setTimeout(() => (testiGrid.style.opacity = "1"), 200);
      }
    });
  });
  dots.forEach((d, idx) => d.addEventListener("click", () => setTesti(idx)));

  /* Portfolio filter */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioCards = document.querySelectorAll(".portfolio-card");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      portfolioCards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.dataset.hidden = match ? "false" : "true";
      });
    });
  });

  /* Contact form — client-side only feedback (no backend configured) */
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = contactForm.querySelector(".form-status");
      const required = contactForm.querySelectorAll("[required]");
      let valid = true;
      required.forEach((field) => {
        if (!field.value.trim()) valid = false;
      });
      if (!status) return;
      status.className = "form-status " + (valid ? "is-success" : "is-error");
      status.textContent = valid
        ? "Thank you! Your inquiry has been submitted. We'll get back to you within 24 hours to discuss your project."
        : "Please fill in all required fields before submitting.";
      if (valid) contactForm.reset();
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
