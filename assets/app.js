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
      { threshold: 0 }).observe(bandeau.querySelector('.chiffres'));
    new IntersectionObserver(function (e) { barre.classList.toggle('solide', !e[0].isIntersecting); },
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 }).observe(document.querySelector('.bandeau h1'));
  }

  /* ── Rail : le courant suit la lecture, les jalons s'allument quand on les dépasse ── */
  var rail = document.querySelector('.rail');
  var courant = rail && rail.querySelector('.courant');
  var jalons = Array.prototype.slice.call(document.querySelectorAll('.jalon'));
  var liens = Array.prototype.slice.call(document.querySelectorAll('.liens-nav a'));
  var attente = false, dernierLien = null;
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
    var cibleId = horsMain ? 'contact' : (actif ? actif.id : '');
    liens.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + cibleId)); });
    /* Menu en bande défilante (téléphone) : le lien de la section lue reste visible, au centre. */
    var bande = document.querySelector('.liens-nav');
    if (bande && cibleId !== dernierLien && bande.scrollWidth > bande.clientWidth) {
      dernierLien = cibleId;
      var lienActif = bande.querySelector('a[aria-current="true"]');
      if (lienActif) bande.scrollTo({ left: lienActif.offsetLeft - (bande.clientWidth - lienActif.offsetWidth) / 2, behavior: 'smooth' });
    }
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
    var doigts = 0, zoomee = function () { return window.visualViewport && window.visualViewport.scale > 1.05; };
    cadre.addEventListener('pointerdown', function (e) { doigts++; x0 = doigts === 1 && !zoomee() ? e.clientX : null; });
    cadre.addEventListener('pointercancel', function () { doigts = Math.max(0, doigts - 1); x0 = null; });
    cadre.addEventListener('pointerup', function (e) {
      doigts = Math.max(0, doigts - 1);
      if (x0 === null || vues.length < 2 || zoomee()) { x0 = null; return; }
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) afficher(indice + (dx < 0 ? 1 : -1));
    });
    document.getElementById('zoom-fermer').addEventListener('click', function () { zoom.close(); });
    zoom.addEventListener('click', function (e) { if (e.target === zoom) zoom.close(); });
  }

  /* ── Avatar : bulle de BD ──
     Souris : au survol (ou au focus clavier) d'un projet ou d'un agent.
     Écran tactile (pas de survol) : l'avatar commente de lui-même la carte qui passe au centre de l'écran,
     un toucher sur une carte (hors capture) ou sur l'avatar relance le commentaire ; la bulle reste le temps
     de lire (selon la longueur du texte), avec une jauge de temps, et se ferme d'un toucher. */
  var avatar = document.getElementById('avatar'), bulle = document.getElementById('bulle');
  var texte = document.getElementById('bulle-texte'), img = document.getElementById('avatar-img');
  var jauge = document.getElementById('bulle-temps'), croix = document.getElementById('bulle-x');
  if (avatar && bulle && texte && img) {
    var tactile = window.matchMedia('(hover: none)').matches;
    if (tactile) document.body.classList.add('tactile');
    ['idle', 'wow', 'point', 'sigh'].forEach(function (h) { var p = new Image(); p.src = 'assets/avatar/' + h + '.png'; });
    var minuterie = null, courantEl = null, vus = [], fermes = 0;
    var langue = function () { return racine.getAttribute('lang') === 'en' ? 'en' : 'fr'; };
    var cacher = function () { clearTimeout(minuterie); bulle.hidden = true; avatar.classList.remove('parle'); img.src = 'assets/avatar/idle.png'; courantEl = null; };
    var montrer = function (msg, humeur, duree) {
      clearTimeout(minuterie);
      texte.textContent = msg;
      img.src = 'assets/avatar/' + (humeur || 'idle') + '.png';
      bulle.hidden = false; avatar.classList.add('parle');
      if (jauge) { jauge.style.animation = 'none'; void jauge.offsetWidth; jauge.style.animation = ''; jauge.style.animationDuration = duree + 'ms'; }
      if (duree) minuterie = setTimeout(cacher, duree);
    };
    /* Durée de lecture au toucher : 4,5 s + 70 ms par caractère, entre 7 et 16 s. */
    var dureeLecture = function (msg) { return Math.min(16000, Math.max(7000, 4500 + msg.length * 70)); };
    var message = function (el) { return el.getAttribute('data-' + langue()) || ''; };
    var cartes = document.querySelectorAll('[data-bulle]');

    /* Souris et stylet : survol et clavier (le toucher n'a pas de « sortie », il est traité plus bas). */
    cartes.forEach(function (el) {
      var sur = function () { courantEl = el; montrer(message(el), el.getAttribute('data-mood'), 9000); };
      var hors = function () { if (courantEl === el) { clearTimeout(minuterie); minuterie = setTimeout(cacher, 350); } };
      el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') sur(); });
      el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') hors(); });
      el.addEventListener('focus', function () { if (el.matches(':focus-visible')) sur(); });
      el.addEventListener('blur', function () { if (!tactile) hors(); });
    });

    if (tactile) {
      var parler = function (el) {
        var msg = message(el);
        if (!msg) return;
        courantEl = el;
        montrer(msg, el.getAttribute('data-mood'), dureeLecture(msg));
        if (vus.indexOf(el) < 0) vus.push(el);
      };
      /* Un toucher sur la carte (la capture, elle, ouvre l'agrandissement). */
      cartes.forEach(function (el) {
        el.addEventListener('click', function (e) { if (!e.target.closest('.media')) parler(el); });
      });
      /* Un toucher sur l'avatar : il commente ce qui est au centre de l'écran, sinon il redit bonjour. */
      img.addEventListener('click', function () {
        var c = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        var el = c && c.closest('[data-bulle]');
        if (el) parler(el);
        else { var s = img.getAttribute('data-salut-touch-' + langue()); courantEl = null; montrer(s, 'idle', dureeLecture(s)); }
      });
      /* Un toucher sur la bulle (ou la croix) la ferme ; deux fermetures de suite : l'avatar arrête de parler tout seul. */
      var fermer = function () { fermes++; cacher(); };
      bulle.addEventListener('click', fermer);
      if (croix) croix.addEventListener('click', function (e) { e.stopPropagation(); fermer(); });

      if ('IntersectionObserver' in window) {
        /* La carte qui couvre la ligne centrale de l'écran, restée 0,7 s, est commentée (une seule fois par visite). */
        var attente = null, candidat = null;
        var centre = new IntersectionObserver(function (entrees) {
          entrees.forEach(function (e) {
            if (e.isIntersecting) {
              candidat = e.target; clearTimeout(attente);
              attente = setTimeout(function () {
                if (candidat !== e.target || fermes >= 2 || (zoom && zoom.open) || document.body.classList.contains('haut')) return;
                if (vus.indexOf(e.target) >= 0) return;
                parler(e.target);
              }, 700);
            } else if (candidat === e.target) { clearTimeout(attente); candidat = null; }
          });
        }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });
        cartes.forEach(function (el) { centre.observe(el); });
        /* Quand la carte commentée a quitté l'écran, la bulle s'efface après un court délai. */
        var sortie = new IntersectionObserver(function (entrees) {
          entrees.forEach(function (e) {
            if (!e.isIntersecting && e.target === courantEl && !bulle.hidden) { clearTimeout(minuterie); minuterie = setTimeout(cacher, 1200); }
          });
        }, { threshold: 0 });
        cartes.forEach(function (el) { sortie.observe(el); });
      }
      /* Première apparition de l'avatar, après l'en-tête : un mot pour dire comment l'utiliser. */
      var salutFait = false;
      new MutationObserver(function () {
        if (salutFait || document.body.classList.contains('haut')) return;
        salutFait = true;
        setTimeout(function () { if (!courantEl && bulle.hidden) { var s = img.getAttribute('data-salut-touch-' + langue()); montrer(s, 'idle', dureeLecture(s)); } }, 900);
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } else if (window.innerWidth >= 900) {
      /* Bonjour discret : seulement sur grand écran, pour ne pas masquer les chiffres. */
      setTimeout(function () { if (!courantEl) montrer(img.getAttribute('data-salut-' + langue()), 'idle', 5500); }, 1600);
    }
  }
})();
