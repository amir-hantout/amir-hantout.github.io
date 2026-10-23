/* Vitrine IA — comportements. Aucun suivi, aucun cookie : seul le choix de langue est gardé dans le stockage local. */
(function () {
  'use strict';
  var racine = document.documentElement;

  /* ── Langue : bascule FR / EN, textes alternatifs des images compris ── */
  var boutons = document.querySelectorAll('.langues button');
  function appliquerLangue(l) {
    racine.setAttribute('lang', l);
    boutons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.querySelectorAll('img[data-alt-en]').forEach(function (img) {
      if (!img.dataset.altFr) img.dataset.altFr = img.alt;
      img.alt = l === 'en' ? img.dataset.altEn : img.dataset.altFr;
    });
    document.querySelectorAll('.media[data-label-en]').forEach(function (b) {
      if (!b.dataset.labelFr) b.dataset.labelFr = b.getAttribute('aria-label');
      b.setAttribute('aria-label', l === 'en' ? b.dataset.labelEn : b.dataset.labelFr);
    });
    try { localStorage.setItem('vitrine-langue', l); } catch (e) { /* stockage indisponible */ }
  }
  var choix = 'fr';
  try {
    var memo = localStorage.getItem('vitrine-langue');
    if (memo === 'fr' || memo === 'en') choix = memo;
    else if ((navigator.language || '').toLowerCase().indexOf('fr') !== 0) choix = 'en';
  } catch (e) { /* ignoré */ }
  appliquerLangue(choix);
  boutons.forEach(function (b) { b.addEventListener('click', function () { appliquerLangue(b.dataset.lang); }); });

  /* ── Arrivée de l'en-tête (une seule séquence) ── */
  requestAnimationFrame(function () { document.body.classList.add('pret'); });

  /* ── Barre pleine après le nom ; circuit en pause quand l'en-tête est hors écran ── */
  var bandeau = document.querySelector('.bandeau'), barre = document.querySelector('.barre');
  if (bandeau && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      bandeau.classList.toggle('hors-ecran', !e[0].isIntersecting);
    }).observe(bandeau);
    /* Sur téléphone, l'avatar attend la fin de l'en-tête pour ne pas couvrir les chiffres. */
    new IntersectionObserver(function (e) { document.body.classList.toggle('haut', e[0].isIntersecting); },
      { threshold: 0, rootMargin: '0px 0px -55% 0px' }).observe(bandeau.querySelector('.chiffres'));
    new IntersectionObserver(function (e) { barre.classList.toggle('solide', !e[0].isIntersecting); },
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 }).observe(document.querySelector('.bandeau h1'));
  }

  /* ── Rail : le courant suit la lecture, les jalons s'allument quand on les dépasse ── */
  var rail = document.querySelector('.rail');
  var courant = rail && rail.querySelector('.courant');
  var jalons = Array.prototype.slice.call(document.querySelectorAll('.jalon'));
  var liens = Array.prototype.slice.call(document.querySelectorAll('.liens-nav a'));
  var attente = false;
  function majRail() {
    attente = false;
    var repere = window.innerHeight * 0.45;
    if (rail && courant && rail.offsetParent !== null) {
      var r = rail.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (repere - r.top) / Math.max(1, r.height)));
      courant.style.transform = 'translateY(' + Math.round(p * Math.max(0, r.height - 96)) + 'px)';
    }
    var actif = null;
    jalons.forEach(function (j) {
      var passe = j.getBoundingClientRect().top < repere;
      j.classList.toggle('passe', passe);
      if (passe) actif = j.closest('section');
    });
    var horsMain = document.getElementById('contact').getBoundingClientRect().top < repere;
    liens.forEach(function (a) {
      var cible = horsMain ? 'contact' : (actif ? actif.id : '');
      a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + cible));
    });
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(majRail); } }
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', demander);
  majRail();

  /* ── Agrandissement des captures, avec galerie pour les applications qui en ont une ──
     Boîte de dialogue native (Échap ferme, le focus revient au bouton) ; flèches, touches ← →, balayage au doigt. */
  var zoom = document.getElementById('zoom');
  if (zoom && typeof zoom.showModal === 'function') {
    var zImg = document.getElementById('zoom-img'), zTitre = document.getElementById('zoom-titre');
    var zCompteur = document.getElementById('zoom-compteur'), zVign = document.getElementById('zoom-vignettes');
    var vues = [], indice = 0, titre = '';
    var libelle = function (v) { return racine.getAttribute('lang') === 'en' ? v.en : v.fr; };
    var afficher = function (i, instant) {
      indice = (i + vues.length) % vues.length;
      var v = vues[indice];
      zTitre.textContent = titre + (vues.length > 1 && libelle(v) ? ' — ' + libelle(v) : '');
      zCompteur.textContent = vues.length > 1 ? (indice + 1) + ' / ' + vues.length : '';
      Array.prototype.forEach.call(zVign.children, function (b, k) { b.setAttribute('aria-current', String(k === indice)); });
      var charger = function () { zImg.src = v.src; zImg.alt = v.alt || (titre + (libelle(v) ? ' — ' + libelle(v) : '')); };
      if (instant) { charger(); return; }
      zImg.classList.add('change');
      var pre = new Image();
      pre.onload = pre.onerror = function () { setTimeout(function () { charger(); zImg.classList.remove('change'); }, 120); };
      pre.src = v.src;
      [indice + 1, indice - 1].forEach(function (k) { var p = new Image(); p.src = vues[(k + vues.length) % vues.length].src; });
    };
    document.querySelectorAll('.media[data-zoom]').forEach(function (b) {
      b.addEventListener('click', function () {
        var vignette = b.querySelector('img');
        titre = b.dataset.titre || '';
        try { vues = b.dataset.galerie ? JSON.parse(b.dataset.galerie) : []; } catch (e) { vues = []; }
        if (!vues.length) vues = [{ src: b.dataset.zoom, mini: vignette ? vignette.currentSrc : '', fr: '', en: '', alt: vignette ? vignette.alt : '' }];
        zoom.classList.toggle('unique', vues.length < 2);
        zVign.replaceChildren();
        if (vues.length > 1) vues.forEach(function (v, k) {
          var t = document.createElement('button');
          t.type = 'button'; t.setAttribute('aria-label', libelle(v));
          var im = document.createElement('img'); im.src = v.mini; im.alt = ''; t.appendChild(im);
          t.addEventListener('click', function () { afficher(k); });
          zVign.appendChild(t);
        });
        afficher(0, true);
        zoom.showModal();
      });
    });
    document.getElementById('zoom-prec').addEventListener('click', function () { afficher(indice - 1); });
    document.getElementById('zoom-suiv').addEventListener('click', function () { afficher(indice + 1); });
    zoom.addEventListener('keydown', function (e) {
      if (vues.length < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); afficher(indice - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); afficher(indice + 1); }
    });
    var x0 = null;
    var cadre = document.getElementById('zoom-cadre');
    cadre.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    cadre.addEventListener('pointerup', function (e) {
      if (x0 === null || vues.length < 2) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) afficher(indice + (dx < 0 ? 1 : -1));
    });
    document.getElementById('zoom-fermer').addEventListener('click', function () { zoom.close(); });
    zoom.addEventListener('click', function (e) { if (e.target === zoom) zoom.close(); });
  }

  /* ── Avatar : bulle de BD au survol ou au focus d'un projet ou d'un agent ── */
  var avatar = document.getElementById('avatar'), bulle = document.getElementById('bulle');
  var texte = document.getElementById('bulle-texte'), img = document.getElementById('avatar-img');
  if (avatar && bulle && texte && img) {
    ['idle', 'wow', 'point', 'sigh'].forEach(function (h) { var p = new Image(); p.src = 'assets/avatar/' + h + '.png'; });
    var minuterie = null, courantEl = null;
    var langue = function () { return racine.getAttribute('lang') === 'en' ? 'en' : 'fr'; };
    var cacher = function () { bulle.hidden = true; avatar.classList.remove('parle'); img.src = 'assets/avatar/idle.png'; courantEl = null; };
    var montrer = function (msg, humeur, duree) {
      clearTimeout(minuterie);
      texte.textContent = msg;
      img.src = 'assets/avatar/' + (humeur || 'idle') + '.png';
      bulle.hidden = false; avatar.classList.add('parle');
      if (duree) minuterie = setTimeout(cacher, duree);
    };
    document.querySelectorAll('[data-bulle]').forEach(function (el) {
      var sur = function () { courantEl = el; montrer(el.getAttribute('data-' + langue()), el.getAttribute('data-mood'), 9000); };
      var hors = function () { if (courantEl === el) { clearTimeout(minuterie); minuterie = setTimeout(cacher, 350); } };
      el.addEventListener('pointerenter', sur);
      el.addEventListener('pointerleave', hors);
      el.addEventListener('focus', sur);
      el.addEventListener('blur', hors);
    });
    /* Bonjour discret : seulement sur grand écran, pour ne pas masquer les chiffres. */
    if (window.innerWidth >= 900) {
      setTimeout(function () { if (!courantEl) montrer(img.getAttribute('data-salut-' + langue()), 'idle', 5500); }, 1600);
    }
  }
})();
