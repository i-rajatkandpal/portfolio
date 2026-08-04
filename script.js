/* ─────────────────────────────────────────
   1. CUSTOM CURSOR
───────────────────────────────────────── */
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');

let mx = -100, my = -100;   // mouse
let rx = -100, ry = -100;   // ring (lagged)

function lerp(a, b, t) { return a + (b - a) * t; }

if (dot && ring) {
    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
    });

    (function animateCursor() {
        rx = lerp(rx, mx, 0.12);
        ry = lerp(ry, my, 0.12);
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(animateCursor);
    })();

    // hover state on interactive elements
    const interactEls = document.querySelectorAll('a, button, .tilt-card, input, textarea');
    interactEls.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));
}

/* ─────────────────────────────────────────
   2. HERO AMBIENT GLOW (follows cursor)
───────────────────────────────────────── */
const heroSection = document.getElementById('hero');
const ambientOrb = heroSection && heroSection.querySelector('.hero-ambient');
if (heroSection && ambientOrb) {
    heroSection.addEventListener('mousemove', e => {
        const rect = heroSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        ambientOrb.style.left = x + '%';
        ambientOrb.style.top = y + '%';
    });
}

/* ─────────────────────────────────────────
   3. SCROLL FADE-IN
───────────────────────────────────────── */
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ─────────────────────────────────────────
   4. SCRAMBLE TEXT REVEAL
───────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

function scramble(el) {
    const target = el.dataset.text || el.textContent;
    let frame = 0;
    const total = 20;
    el.classList.add('scramble-active');

    const tick = setInterval(() => {
        el.textContent = target
            .split('')
            .map((char, i) => {
                if (char === ' ') return ' ';
                if (i < Math.floor((frame / total) * target.length)) return char;
                return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('');
        frame++;
        if (frame >= total) {
            el.textContent = target;
            el.classList.remove('scramble-active');
            clearInterval(tick);
        }
    }, 40);
}

const scrambleObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            setTimeout(() => scramble(e.target), 100);
            scrambleObs.unobserve(e.target);
        }
    });
}, { threshold: 0.4 });

document.querySelectorAll('.scramble-text').forEach(el => scrambleObs.observe(el));

/* ─────────────────────────────────────────
   5. ANIMATED STAT COUNTERS
───────────────────────────────────────── */
function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimal = parseInt(el.dataset.decimal || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
        const pct = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - pct, 3);   // ease-out-cubic
        const val = eased * target;
        el.textContent = val.toFixed(decimal) + suffix;
        if (pct < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimal) + suffix;
    }
    requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            animateCounter(e.target);
            counterObs.unobserve(e.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-n[data-target]').forEach(el => counterObs.observe(el));

/* ─────────────────────────────────────────
   6. 3D TILT ON CARDS
───────────────────────────────────────── */
document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 to 0.5
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `
      perspective(800px)
      rotateY(${x * 8}deg)
      rotateX(${-y * 5}deg)
      translateZ(4px)
    `;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
    });
});

/* ─────────────────────────────────────────
   7. MAGNETIC BUTTONS
───────────────────────────────────────── */
document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'transform 0.1s ease';
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0,0)';
        el.style.transition = 'transform 0.4s cubic-bezier(0.23,1,0.32,1)';
    });
});

/* ─────────────────────────────────────────
   8. MOBILE BURGER
───────────────────────────────────────── */
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
if (burger && drawer) {
    burger.addEventListener('click', () => drawer.classList.toggle('open'));
    drawer.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => drawer.classList.remove('open'))
    );
}

/* ─────────────────────────────────────────
   9. ACTIVE SIDEBAR NAV
───────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const snavLinks = document.querySelectorAll('.snav-link');

const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            snavLinks.forEach(l => l.classList.remove('active'));
            const a = document.querySelector(`.snav-link[data-section="${e.target.id}"]`);
            if (a) a.classList.add('active');
        }
    });
}, { threshold: 0.4 });

sections.forEach(s => navObs.observe(s));
