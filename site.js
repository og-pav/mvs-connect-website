/* MVS Connect — shared site behaviour
   GSAP (loaded from cdnjs in each page) drives entries + scroll reveals. */
(function () {
  "use strict";

  var d = document, w = window;

  /* ---------- Sticky header: blur after ~80px ---------- */
  var header = d.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", w.scrollY > 80);
  }
  w.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = d.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      d.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", d.body.classList.contains("menu-open"));
    });
    d.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () { d.body.classList.remove("menu-open"); });
    });
  }

  /* ---------- FAQ accordion ---------- */
  d.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      // close siblings for a tidy accordion
      item.parentElement.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = null;
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Smooth anchor scroll (buttery ease via GSAP if present) ---------- */
  d.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = d.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + w.scrollY - 132;
      if (w.gsap && w.ScrollToPlugin) {
        gsap.to(w, { duration: 0.9, ease: "power2.out", scrollTo: y });
      } else {
        w.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  });

  /* ---------- Testimonial marquee: duplicate track for seamless loop ---------- */
  d.querySelectorAll(".marquee-track").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Popup enquiry (once per session, on immediate visit) ---------- */
  var overlay = d.getElementById("enquiry-popup");
  if (overlay) {
    var KEY = "mvs_popup_shown";
    var show = function () {
      overlay.classList.add("show");
      d.body.style.overflow = "hidden";
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    };
    var hide = function () {
      overlay.classList.remove("show");
      d.body.style.overflow = "";
    };
    overlay.addEventListener("click", function (e) { if (e.target === overlay) hide(); });
    overlay.querySelectorAll("[data-popup-close]").forEach(function (b) { b.addEventListener("click", hide); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    d.querySelectorAll("[data-popup-open]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); show(); });
    });
    var already = false;
    try { already = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!already && overlay.dataset.auto !== "off") {
      setTimeout(show, 1400);
    }
  }

  /* ---------- Native form handling (placeholder until GHL endpoint wired) ---------- */
  d.querySelectorAll("form[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      /* GA4 conversion event (fires when GA is configured) */
      if (typeof gtag === "function") {
        gtag("event", "generate_lead", { form_id: form.id || "lead-form" });
      }
      /* TODO GHL: replace with GoHighLevel form submission / keep the GHL
         iframe embed instead. Redirecting to thank-you preserves the
         Google Ads conversion flow. */
      w.location.href = form.dataset.thanks || "thank-you.html";
    });
  });

  /* ---------- GSAP animations ---------- */
  function initGsap() {
    if (!w.gsap) { d.documentElement.classList.add("gs-done"); return; }
    if (w.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (w.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

    /* Hero entry: stagger fade-up ~800ms total */
    var heroEls = d.querySelectorAll("[data-hero-seq]");
    if (heroEls.length) {
      gsap.fromTo(heroEls,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.14, delay: 0.15 });
    }

    /* Scroll reveals: fade + rise 28px at 80% viewport, once */
    d.querySelectorAll(".gs-reveal").forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 80%", once: true }
        });
    });

    /* Staggered groups (cards) */
    d.querySelectorAll("[data-stagger]").forEach(function (group) {
      var kids = group.children;
      gsap.fromTo(kids,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 80%", once: true }
        });
    });

    /* Image mask reveals */
    d.querySelectorAll("[data-mask-reveal]").forEach(function (el) {
      gsap.fromTo(el,
        { clipPath: "inset(0 100% 0 0 round 24px)" },
        {
          clipPath: "inset(0 0% 0 0 round 24px)", duration: 1.05, ease: "power3.inOut",
          scrollTrigger: { trigger: el, start: "top 82%", once: true }
        });
    });

    /* Step icons pop in */
    d.querySelectorAll(".step-ic, .b-ic").forEach(function (ic) {
      gsap.fromTo(ic, { scale: 0.4, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2)",
          scrollTrigger: { trigger: ic, start: "top 85%", once: true }
        });
    });

    /* Hero background parallax on mouse */
    var hero = d.querySelector(".hero");
    if (hero && w.matchMedia("(pointer:fine)").matches) {
      var blobs = hero.querySelectorAll(".bolt-float, .bg-grad");
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        blobs.forEach(function (b, i) {
          var depth = (i + 1) * 8;
          gsap.to(b, { x: x * depth, y: y * depth, duration: 1.2, ease: "power2.out" });
        });
      });
    }
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", initGsap);
  else initGsap();
})();
