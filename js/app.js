// Maven Landing Template — CMS-ready dynamic renderer
// CARA JADI TEMPLATE: duplikat folder ini, edit content/site.config.json + content/*.json. Selesai.
// UPGRADE KE STRAPI: set CMS_ENDPOINT ke URL API, schema sudah 1:1.
const CMS_ENDPOINT = null; // ex: "https://cms-anda.com/api/landing?populate=*"
let LANG = localStorage.getItem('maven-lang') || 'id';
let SITE = null, T = null;

const $ = (id) => document.getElementById(id);
const waLink = (text) => `https://wa.me/${SITE?.contact?.whatsapp || '6281234567890'}?text=${encodeURIComponent(text)}`;

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  return r.json();
}

async function boot() {
  try {
    if (CMS_ENDPOINT) {
      const r = await fetch(`${CMS_ENDPOINT}&locale=${LANG}`);
      const j = await r.json();
      T = j.data.attributes;
      SITE = T.siteConfig;
    } else {
      [SITE, T] = await Promise.all([
        loadJSON('content/site.config.json'),
        loadJSON(`content/content.${LANG}.json`)
      ]);
    }
  } catch (e) {
    // Fallback: bisa dibuka via double-click file:// tanpa server + tetap bisa deploy statis
    console.warn('Fetch JSON gagal, pakai data embedded (file:// ready).', e);
    SITE = window.__SITE__ || SITE;
    T = (LANG === 'en' ? window.__EN__ : window.__ID__) || T;
    if (!T) { alert('Data konten tidak ditemukan.'); return; }
  }
  document.documentElement.lang = LANG;
  applyTheme();
  renderAll();
  bindOnce();
}

function applyTheme() {
  const t = SITE.theme || {};
  const root = document.documentElement.style;
  if (t.primary) root.setProperty('--primary', t.primary);
  if (t.primaryDark) root.setProperty('--primary-dark', t.primaryDark);
  if (t.accent) root.setProperty('--accent', t.accent);
  if (t.bg) root.setProperty('--bg', t.bg);
  document.title = T.meta.title;
  document.querySelector('meta[name="description"]').content = T.meta.description;
}

function renderAll() {
  // NAV
  $('navLinks').innerHTML = T.nav.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('');
  $('navCta').textContent = T.nav.cta.label;
  $('mobileLinks').innerHTML = T.nav.links.map(l => `<a class="big" href="${l.href}">${l.label}</a>`).join('');
  $('mobileCta').textContent = T.nav.cta.label;
  $('btnID').classList.toggle('active', LANG === 'id');
  $('btnEN').classList.toggle('active', LANG === 'en');

  // HERO
  $('heroEyebrow').textContent = T.hero.eyebrow;
  $('heroTitle').textContent = T.hero.title;
  $('heroAccent').textContent = T.hero.titleAccent;
  $('heroSub').textContent = T.hero.subtitle;
  $('heroPrimary').textContent = T.hero.primaryCta.label;
  $('heroSecondary').textContent = T.hero.secondaryCta.label;
  $('heroBadges').innerHTML = T.hero.badges.map(b => `<span>${b}</span>`).join('');
  $('mediaTitle').textContent = T.hero.mediaCard.title;
  $('mediaItem').textContent = T.hero.mediaCard.item;
  $('mediaPrice').textContent = T.hero.mediaCard.price;
  $('mediaReviews').textContent = T.hero.mediaCard.rating;
  $('mediaOpen').textContent = '● ' + T.hero.mediaCard.open;

  // LOGOS
  $('logosHeading').textContent = T.logos.heading;
  $('logosSub').textContent = T.logos.sub;
  const items = [...T.logos.items, ...T.logos.items];
  $('marquee').innerHTML = items.map(i => `<span>✦ ${i}</span>`).join('');

  // GALLERY SLIDESHOW
  if (T.gallery) {
    $('galKicker').textContent = T.gallery.eyebrow;
    $('galTitle').textContent = T.gallery.title;
    $('galSub').textContent = T.gallery.sub;
    renderGallery();
  }

  // SERVICES
  $('svcKicker').textContent = T.services.eyebrow;
  $('svcTitle').textContent = T.services.title;
  $('svcSub').textContent = T.services.sub;
  $('svcGrid').innerHTML = T.services.items.map((s, i) => `
    <div class="card reveal" data-svc="${i}" tabindex="0" role="button" aria-label="${s.title}"><div class="ico">${s.icon}</div><h3>${s.title}</h3><p>${s.desc}</p><a href="#kontak">${s.link}</a></div>`).join('');
  $('svcGrid').querySelectorAll('[data-svc]').forEach(el => {
    const open = () => openDetail({
      hero: T.services.items[el.dataset.svc].icon,
      tag: '', title: T.services.items[el.dataset.svc].title,
      price: T.services.items[el.dataset.svc].price || '',
      desc: T.services.items[el.dataset.svc].detail || T.services.items[el.dataset.svc].desc,
      list: T.services.items[el.dataset.svc].features || []
    }, 'service');
    el.onclick = open;
    el.onkeydown = (e) => { if (e.key === 'Enter') open(); };
  });

  // STATS
  $('statKicker').textContent = T.stats.eyebrow;
  $('statTitle').textContent = T.stats.title;
  $('statGrid').innerHTML = T.stats.items.map((s, i) => `
    <div class="stat"><b><span class="count" data-target="${s.value}" data-dec="${s.decimal ? 1 : 0}">0</span>${s.suffix}</b><div>${s.label}</div><small>${s.desc}</small></div>`).join('');

  // CASES
  $('caseKicker').textContent = T.cases.eyebrow;
  $('caseTitle').textContent = T.cases.title;
  $('caseSub').textContent = T.cases.sub;
  renderCases('All');

  const filterLabels = LANG === 'id'
    ? ['Semua', 'Coffee', 'Food', 'Space', 'Korporat']
    : ['All', 'Coffee', 'Food', 'Space', 'Corporate'];
  $('caseFilters').innerHTML = filterLabels.map((f, i) =>
    `<button class="${i === 0 ? 'active' : ''}" data-f="${f}">${f}</button>`).join('');
  $('caseFilters').querySelectorAll('button').forEach(b => b.onclick = () => {
    $('caseFilters').querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    renderCases(b.dataset.f);
    track('filter_case', b.dataset.f);
  });

  // TESTI
  $('testiKicker').textContent = T.testimonials.eyebrow;
  $('testiTitle').textContent = T.testimonials.title;
  $('testiTrack').innerHTML = T.testimonials.items.map(t => `
    <div class="testi"><div style="color:var(--accent)">${'★'.repeat(t.stars)}</div>
    <q>${t.quote}</q><div class="testi-meta"><div class="avatar">${t.initial}</div>
    <div><b style="font-size:14px">${t.name}</b><br><small style="color:var(--muted)">${t.role}</small></div></div></div>`).join('');
  buildDots();

  // FORM
  $('formKicker').textContent = T.form.eyebrow;
  $('formTitle').textContent = T.form.title;
  $('formSub').innerHTML = T.form.sub;
  $('lName').textContent = T.form.fields.name + ' *';
  $('lEmail').textContent = T.form.fields.email + ' *';
  $('lCompany').textContent = T.form.fields.company;
  $('lPhone').textContent = T.form.fields.phone + ' *';
  $('lType').textContent = T.form.fields.type;
  $('lMsg').textContent = T.form.fields.message + ' *';
  $('fType').innerHTML = T.form.types.map(t => `<option>${t}</option>`).join('');
  $('submitBtn').textContent = T.form.submit;
  $('mTitle').textContent = T.form.successTitle;
  $('mDesc').textContent = T.form.successDesc;
  $('mWa').textContent = T.form.waButton;
  $('mClose').textContent = T.form.close;
  $('contactList').innerHTML = `
    <li>📍 ${SITE.contact.address}</li><li>🕗 ${SITE.contact.hours}</li>
    <li>📞 ${SITE.contact.phone}</li><li>✉️ ${SITE.contact.email}</li>`;
  $('directWa').href = waLink(LANG === 'id' ? 'Halo Maven! Saya mau tanya-tanya dulu.' : 'Hi Maven! I have a question.');
  $('stickyBtn').textContent = '📅 ' + T.sticky.label;
  $('stickyWa').textContent = T.sticky.wa;
  $('stickyWa').href = waLink('Halo Maven!');

  // FOOTER
  $('footDesc').textContent = T.footer.desc;
  $('footCols').innerHTML = T.footer.cols.map(c => `
    <div><h4>${c.title}</h4>${c.links.map(l => `<div style="margin:6px 0"><a href="#">${l}</a></div>`).join('')}</div>`).join('');
  $('year').textContent = new Date().getFullYear();
  $('footRights').textContent = T.footer.rights;
  $('footMade').textContent = T.footer.madeIn;
  $('cookieText').textContent = T.cookie.text;
  $('cookieOk').textContent = T.cookie.accept;
  $('cookieNo').textContent = T.cookie.reject;

  initObservers();
}

function renderCases(f) {
  const norm = (s) => s.toLowerCase();
  const list = T.cases.items.filter(c => norm(f) === 'semua' || norm(f) === 'all' ? true : norm(c.tag) === norm(f) || (norm(f) === 'corporate' && norm(c.tag) === 'korporat') || (norm(f) === 'korporat' && norm(c.tag) === 'corporate'));
  $('caseGrid').innerHTML = list.map((c, i) => `
    <div class="card case-card reveal in" data-case="${T.cases.items.indexOf(c)}" tabindex="0" role="button" aria-label="${c.title}"><div class="case-top">${c.emoji}</div>
    <div class="case-body"><span class="tag">${c.tag}</span><h3 style="margin:6px 0">${c.title}</h3>
    <p style="color:var(--muted);font-size:14px">${c.desc}</p><span class="badge">📊 ${c.metric}</span> <span class="badge" style="background:#3E2A1E;color:#F6F0E4">Lihat detail →</span></div></div>`).join('');
  $('caseGrid').querySelectorAll('[data-case]').forEach(el => {
    const open = () => {
      const c = T.cases.items[el.dataset.case];
      openDetail({ hero: c.emoji, tag: c.tag, title: c.title, price: c.price || c.metric, desc: c.detail || c.desc, list: c.points || [] }, 'case');
    };
    el.onclick = open;
    el.onkeydown = (e) => { if (e.key === 'Enter') open(); };
  });
}

function openDetail(d, kind) {
  $('detailHero').textContent = d.hero;
  $('detailTag').style.display = d.tag ? '' : 'none';
  $('detailTag').textContent = d.tag;
  $('detailTitle').textContent = d.title;
  $('detailPrice').textContent = d.price;
  $('detailPrice').style.display = d.price ? '' : 'none';
  $('detailDesc').textContent = d.desc;
  $('detailList').innerHTML = (d.list || []).map(x => `<li>✅ ${x}</li>`).join('');
  $('detailCta').href = waLink((LANG === 'id' ? `Halo Maven! Saya tertarik: ${d.title} (${d.price}). Bisa info lebih lanjut?` : `Hi Maven! I'm interested: ${d.title} (${d.price}). More info please?`));
  $('detailCta').textContent = LANG === 'id' ? 'Pesan via WhatsApp' : 'Order via WhatsApp';
  $('detailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  track('open_detail', `${kind}:${d.title}`);
}
function closeDetail() { $('detailModal').classList.remove('open'); document.body.style.overflow = ''; }

// Gallery slideshow: MANUAL only (panah / dots / swipe). Tanpa autoplay agar tidak nyedot scroll.
let galIdx = 0;
function renderGallery() {
  const items = T.gallery.items;
  galIdx = 0;
  $('slides').innerHTML = items.map((g, i) =>
    `<div class="slide"><img src="${g.src}" alt="${g.caption}" ${i > 0 ? 'loading="lazy"' : ''}></div>`).join('');
  $('slideDots').innerHTML = items.map((_, i) =>
    `<button aria-label="foto ${i + 1}" class="${i === 0 ? 'active' : ''}"></button>`).join('');
  const track = $('slides'), dots = [...$('slideDots').children];
  const go = (i) => {
    galIdx = (i + items.length) % items.length;
    track.scrollTo({ left: galIdx * track.clientWidth, behavior: 'smooth' });
    dots.forEach((d, j) => d.classList.toggle('active', j === galIdx));
    $('slideCap').textContent = items[galIdx].caption;
    track('gallery_view', galIdx);
  };
  $('slidePrev').onclick = () => go(galIdx - 1);
  $('slideNext').onclick = () => go(galIdx + 1);
  dots.forEach((d, i) => d.onclick = () => go(i));
  let ticking = false;
  track.onscroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const w = track.clientWidth || 1;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(track.scrollLeft / w)));
      if (i !== galIdx) {
        galIdx = i; dots.forEach((d, j) => d.classList.toggle('active', j === i));
        $('slideCap').textContent = items[i]?.caption || '';
      }
      ticking = false;
    });
  };
  $('slideshow').tabIndex = 0;
  $('slideshow').onkeydown = (e) => { if (e.key === 'ArrowRight') go(galIdx + 1); if (e.key === 'ArrowLeft') go(galIdx - 1); };
  $('slideCap').textContent = items[0].caption;
}

// Testimonial dots + autoplay
let testiTimer;
function buildDots() {
  const track = $('testiTrack'), n = track.children.length;
  $('testiDots').innerHTML = Array.from({ length: n }, (_, i) => `<button aria-label="slide ${i + 1}" class="${i === 0 ? 'active' : ''}"></button>`).join('');
  const dots = [...$('testiDots').children];
  track.onscroll = () => {
    const i = Math.round(track.scrollLeft / (track.children[0].offsetWidth + 16));
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
  };
  dots.forEach((d, i) => d.onclick = () => track.scrollTo({ left: i * (track.children[0].offsetWidth + 16), behavior: 'smooth' }));
  clearInterval(testiTimer);
  testiTimer = setInterval(() => {
    const w = track.children[0].offsetWidth + 16;
    const max = track.scrollWidth - track.clientWidth - 10;
    track.scrollBy({ left: track.scrollLeft >= max ? -track.scrollWidth : w, behavior: 'smooth' });
  }, 4000);
}

// Counter + reveal + sticky + scroll depth
function initObservers() {
  const counters = document.querySelectorAll('.count');
  const cObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = parseFloat(el.dataset.target), dec = el.dataset.dec === '1';
    const t0 = performance.now(), dur = 1400;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(1) : Math.round(v).toString();
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    cObs.unobserve(el);
  }), { threshold: .5 });
  counters.forEach(c => cObs.observe(c));

  const rObs = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => rObs.observe(el));
}

function bindOnce() {
  if (bindOnce.done) return; bindOnce.done = true;
  $('btnID').onclick = () => switchLang('id');
  $('btnEN').onclick = () => switchLang('en');
  $('burger').onclick = () => $('mobileMenu').classList.add('open');
  $('menuClose').onclick = () => $('mobileMenu').classList.remove('open');
  $('mobileMenu').querySelectorAll('a').forEach(a => a.onclick = () => $('mobileMenu').classList.remove('open'));

  window.addEventListener('scroll', () => {
    $('stickyCta').classList.toggle('show', window.scrollY > window.innerHeight * .7);
    [25, 50, 75, 100].forEach(p => {
      const key = 'scroll' + p;
      if (!bindOnce[key] && window.scrollY > document.body.scrollHeight * p / 100) {
        bindOnce[key] = true; track('scroll_depth', p + '%');
      }
    });
  }, { passive: true });

  $('leadForm').addEventListener('submit', onSubmit);
  $('mClose').onclick = () => $('successModal').classList.remove('open');
  $('detailClose').onclick = closeDetail;
  $('detailBack').onclick = closeDetail;
  $('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });
  $('detailCta').addEventListener('click', () => closeDetail());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDetail(); $('successModal').classList.remove('open'); } });

  if (!localStorage.getItem('maven-cookie')) $('cookie').classList.add('open');
  $('cookieOk').onclick = () => { localStorage.setItem('maven-cookie', 'ok'); $('cookie').classList.remove('open'); track('cookie', 'accept'); };
  $('cookieNo').onclick = () => { localStorage.setItem('maven-cookie', 'no'); $('cookie').classList.remove('open'); };
}

function switchLang(l) {
  if (l === LANG) return;
  LANG = l; localStorage.setItem('maven-lang', l);
  track('lang_switch', l);
  bootReset();
}
async function bootReset() {
  try { T = await loadJSON(`content/content.${LANG}.json`); }
  catch (e) { T = LANG === 'en' ? window.__EN__ : window.__ID__; }
  renderAll();
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

function onSubmit(e) {
  e.preventDefault();
  track('form_start');
  const name = $('fName').value.trim(), email = $('fEmail').value.trim(),
    phone = $('fPhone').value.trim(), msg = $('fMsg').value.trim();
  const vName = name.length >= 3, vEmail = validEmail(email),
    vPhone = phone.replace(/\D/g, '').length >= 9, vMsg = msg.length >= 10;
  $('eName').classList.toggle('show', !vName);
  $('eEmail').classList.toggle('show', !vEmail);
  $('ePhone').classList.toggle('show', !vPhone);
  $('eMsg').classList.toggle('show', !vMsg);
  if (!(vName && vEmail && vPhone && vMsg)) return;
  const btn = $('submitBtn');
  btn.disabled = true; btn.textContent = '⏳ ...';
  const text = `Halo Maven Coffee & Resto!%0A%0ANama: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0APerusahaan: ${encodeURIComponent($('fCompany').value.trim() || '-')}%0AWA: ${encodeURIComponent(phone)}%0AKebutuhan: ${encodeURIComponent($('fType').value)}%0APesan: ${encodeURIComponent(msg)}`;
  const url = `https://wa.me/${SITE.contact.whatsapp}?text=${text}`;
  setTimeout(() => {
    btn.disabled = false; btn.textContent = T.form.submit;
    $('mWa').href = url;
    $('successModal').classList.add('open');
    track('form_submit', $('fType').value);
  }, 800);
}

// GA4-ready stub: ganti dengan gtag aktual di production
function track(event, detail) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, detail, lang: LANG, ts: Date.now() });
  console.log('[analytics]', event, detail);
}

document.addEventListener('DOMContentLoaded', boot);
