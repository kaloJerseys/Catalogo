/* Capa exclusivamente decorativa. No consulta ni modifica datos del catálogo. */
(() => {
  'use strict';
  if (typeof document === 'undefined') return;

  function decorate() {
    if (document.querySelector('[data-kalo-patrias="strip"]')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    document.body.classList.add('kalo-patrias');

    const svg = (name, box, content) => `<svg class="${name}" viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${content}</svg>`;
    const star = (color, x, y, scale = 1) => `<path class="patrias-${color}" transform="translate(${x} ${y}) scale(${scale})" d="M0-10 2.6-3.2 9.5-3.1 4 1.2 5.8 8 0 4-5.8 8-4 1.2-9.5-3.1-2.6-3.2Z"/>`;
    const waves = (name) => svg(name, '0 0 240 62', '<path class="patrias-wave-low" d="M0 53C55 54 69 14 117 26S186 49 240 0V10C186 59 155 43 116 36S55 62 0 61Z"/><path class="patrias-white" d="M0 45C55 46 69 6 117 18S186 41 240-8V2C186 51 155 35 116 28S55 54 0 53Z"/><path class="patrias-wave-high" d="M0 37C55 38 69-2 117 10S186 33 240-16V-6C186 43 155 27 116 20S55 46 0 45Z"/>');
    const flags = (name) => svg(name, '0 0 180 57', '<path class="patrias-string" d="M0 33Q90 50 180 0"/><path class="patrias-red" d="m8 35 20 2-12 25Z"/><path class="patrias-white patrias-flag-white" d="m39 38 20-1-9 24Z"/><path class="patrias-blue" d="m72 34 20-4-5 25Z"/><path class="patrias-white patrias-flag-white" d="m105 25 20-6-1 25Z"/><path class="patrias-red" d="m137 13 19-8 2 25Z"/>');
    const city = '<path d="M0 142h21v-9h12v9h13v-19h12v19h7v-26h13v26h10v-41h14v41h9v-24h10v24h8V94h16v48h8v-58h12v58h10v-26h14v26h9V70h18v72h9v-39h11v39h8V58h13v84h9v-29h16v29h8V86h11v56h8V41h16v101h9v-31h11v31h9V75h15v67h11V52h14v90h9V26h13v116h9v-40h12v40h8V68h15v74h9V90h13v52h8V53h11v89h12V9h10v133h8V73h13v69h10v-36h17v36h10V91h13v51h9v-17h25v17h13v6H0Z"/><path d="m351 142 3-80 4-34 7-8 7 12 4 50 2 60Zm99 0 4-102 7-17 8 21 8 98Z"/><path class="patrias-city-line" d="M12 153h563M52 158h485M356 28l14-2M358 22l1-16M454 42l15-4M455 57l16-5M455 74l19-6M454 94l22-7"/>';
    const insert = (parent, name, content, before = null, key = name) => {
      if (!parent) return null;
      const element = document.createElement('div');
      element.className = name;
      element.dataset.kaloPatrias = key;
      element.setAttribute('aria-hidden', 'true');
      element.innerHTML = content;
      parent.insertBefore(element, before);
      return element;
    };

    insert(document.body, 'patrias-strip', `${waves('patrias-strip-wave patrias-strip-wave-left')}${svg('patrias-strip-star','0 0 24 24',star('white',12,12,.65))}<span class="patrias-strip-title">Mes de la Patria</span><span class="patrias-strip-celebration">·&nbsp; Celebremos juntos las Fiestas Patrias de Panamá</span>${svg('patrias-strip-star','0 0 24 24',star('white',12,12,.65))}${waves('patrias-strip-wave patrias-strip-wave-right')}`, document.querySelector('.announcement') || document.body.firstChild, 'strip');
    insert(hero.parentElement, 'patrias-bunting-zone', flags('patrias-bunting patrias-bunting-left') + flags('patrias-bunting patrias-bunting-right'), hero);
    insert(hero, 'patrias-hero-badge', `${svg('patrias-badge-ribbon','0 0 220 58','<path class="patrias-red" d="m24 22 181-6 15 13-18 7 5 12-184-4Z"/><path class="patrias-blue" d="M4 23 190 4l5 31L9 54 15 39 0 34Z"/><path class="patrias-ribbon-fold" d="m9 54 10-17 5 15 171-17-5 7Z"/>')}<span class="patrias-badge-ribbon-text">Mes de la Patria</span><span class="patrias-badge-title">Fiestas Patrias<br>de Panamá</span>${svg('patrias-badge-stars','0 0 80 22',star('blue',23,11,.45)+star('blue',40,11,.45)+star('red',57,11,.45))}`);
    insert(hero, 'patrias-hero-city', svg('patrias-city-svg','0 0 600 162', city));
    insert(hero, 'patrias-hero-ribbon', waves('patrias-wave-svg'));
    insert(document.querySelector('.hero-art'), 'patrias-art-stars', svg('patrias-stars-svg','0 0 62 38',star('white',13,8,.33)+star('red',20,25,.4)+star('blue',43,12,.58)));
    insert(document.querySelector('#catalogo .section-heading>div'), 'patrias-catalog-detail', svg('patrias-catalog-stars','0 0 100 30',star('blue',72,13,.8)+star('red',94,16,.45))+waves('patrias-catalog-wave'));

    const how = document.querySelector('.how-to');
    insert(how, 'patrias-how-ribbon patrias-how-ribbon-left', waves('patrias-wave-svg'));
    insert(how, 'patrias-how-ribbon patrias-how-ribbon-right', waves('patrias-wave-svg'));
    insert(how, 'patrias-how-city', svg('patrias-city-svg','0 0 600 162', city+'<path class="patrias-bridge" d="M345 143Q446 27 559 143M345 143Q446 66 559 143M365 143V122M390 143V99M418 143V83M446 143V79M473 143V86M501 143V104M530 143V126"/>'));
    insert(how, 'patrias-how-stars', svg('patrias-stars-svg','0 0 62 56',star('white',24,13,.63)+star('blue',12,35,.45)+star('white',38,39,.32)));
    insert(document.querySelector('footer'), 'patrias-footer-detail', waves('patrias-footer-wave'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate, {once:true});
  else decorate();
})();
