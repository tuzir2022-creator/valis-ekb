/* Слой анимации «Продающего»: плавный скролл, заголовки по словам, шторка фото, волна карточек, параллакс.
   Библиотеки лежат на самом сайте (vendor/), с чужих адресов ничего не грузится.
   Нет библиотек, включено «уменьшить движение» или что-то пошло не так - сайт остаётся обычным, весь текст виден. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  try {
    gsap.registerPlugin(ScrollTrigger);
    var root = document.documentElement;
    root.classList.add("m-on");

    // ЕДИНАЯ кривая сайта (правило Дмитрия от 15.11.2026, образец umapalata.space): резкий старт, долгая мягкая посадка.
    // Это cubic-bezier(.2, .7, .1, 1); та же кривая лежит в CSS как --ease. Все появления используют только её.
    var EASE = (function (x1, y1, x2, y2) {
      var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
      var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
      var sx = function (t) { return ((ax * t + bx) * t + cx) * t; };
      var sy = function (t) { return ((ay * t + by) * t + cy) * t; };
      var dx = function (t) { return (3 * ax * t + 2 * bx) * t + cx; };
      return function (p) {
        if (p <= 0 || p >= 1) return p;
        var t = p, i, d;
        for (i = 0; i < 8; i++) { d = sx(t) - p; if (Math.abs(d) < 1e-5) break; var s = dx(t); if (Math.abs(s) < 1e-6) break; t -= d / s; }
        return sy(t);
      };
    })(0.2, 0.7, 0.1, 1);

    // плавный скролл на компьютере; на телефоне оставляем родной, он лучше
    if (window.Lenis && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href"); if (id.length < 2) return;
          var t = document.querySelector(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, { offset: -76 });
        });
      });
    }

    // заголовки: слова выезжают из-под маски. Делим только по обычному пробелу, неразрывный держит слова вместе
    var heads = document.querySelectorAll("main h1, main h2");
    heads.forEach(function (h) {
      if (h.querySelector("*:not(.s-soft)")) return; // заголовок с вложенной вёрсткой не трогаем (кроме серой части .s-soft)
      var text = h.textContent;
      h.setAttribute("aria-label", text);
      var wrap = function (t) {
        return t.split(/( )/).map(function (w) {
          return w === " " || !w ? w : '<span class="m-w" aria-hidden="true"><i>' + w + "</i></span>";
        }).join("");
      };
      h.innerHTML = Array.prototype.map.call(h.childNodes, function (n) {
        return n.nodeType === 3 ? wrap(n.textContent) : '<span class="s-soft">' + wrap(n.textContent) + "</span>";
      }).join("");
    });

    // первый экран
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.from(".s-hero h1 .m-w > i", { yPercent: 110, rotate: 3, duration: 1.1, stagger: 0.06 }, 0.1)
      .from(".s-hero .s-eyebrow, .s-hero .s-lead, .s-hero .s-ticks, .s-hero .s-rating", { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.4)
      .from(".s-hero__photo", { clipPath: "inset(100% 0% 0% 0% round 18px)", duration: 1.4, ease: EASE }, 0.2)
      .from(".s-hero__photo img", { scale: 1.25, duration: 2, ease: EASE }, 0.2)
      .from(".s-hero__widget", { y: 40, opacity: 0, duration: 1, clearProps: "transform,opacity" }, 0.6)
      .from(".s-bar", { opacity: 0, duration: 0.8, clearProps: "opacity" }, 0.3);
    gsap.to(".s-hero__bg img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".s-hero", start: "top top", end: "bottom top", scrub: true } });

    // остальные заголовки
    document.querySelectorAll("main h2").forEach(function (h) {
      var w = h.querySelectorAll(".m-w > i"); if (!w.length || h.closest(".s-hero")) return;
      gsap.from(w, { yPercent: 110, duration: 1, ease: EASE, stagger: 0.05, scrollTrigger: { trigger: h, start: "top 88%" } });
    });
    gsap.utils.toArray(".s-section__head p, .s-note, .s-reviews__rating").forEach(function (el) {
      gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: EASE, scrollTrigger: { trigger: el, start: "top 92%" } });
    });

    // группы карточек появляются волной
    ["#prices .s-board", ".s-steps", ".s-promises", ".s-reviews", ".s-faq", ".s-contacts"].forEach(function (sel) {
      gsap.utils.toArray(sel).forEach(function (box) {
        var kids = box.children; if (!kids.length) return;
        gsap.from(kids, { y: 36, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: box, start: "top 86%" } });
      });
    });

    // фото: шторка снизу вверх, внутри лёгкий наезд
    gsap.utils.toArray(".s-photos figure").forEach(function (f, i) {
      gsap.from(f, { clipPath: "inset(100% 0% 0% 0% round 14px)", duration: 1.3, ease: EASE, delay: i * 0.08, scrollTrigger: { trigger: f, start: "top 88%" } });
      gsap.from(f.querySelector("img"), { scale: 1.2, duration: 1.8, ease: EASE, delay: i * 0.08, scrollTrigger: { trigger: f, start: "top 88%" } });
    });

    addEventListener("load", function () { ScrollTrigger.refresh(); });
  } catch (err) {
    // не получилось - возвращаем обычный вид, чтобы ничего не осталось скрытым
    document.documentElement.classList.remove("m-on");
    if (window.gsap) gsap.set("main *", { clearProps: "all" });
    if (window.console) console.warn("motion.js:", err);
  }
})();
