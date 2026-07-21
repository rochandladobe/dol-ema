import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Don't build a synthetic hero if the h1/picture is already inside an
    // authored block (e.g. the hero-gov homepage banner).
    if (h1.closest('.hero, .hero-gov') || picture.closest('.hero, .hero-gov')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Returns true when a paragraph's only meaningful content is an image.
 */
function isImageParagraph(el) {
  return el && el.tagName === 'P' && el.querySelector('picture, img') && !el.textContent.trim();
}

/**
 * Wraps a sibling group into a two-column intro row. Text/links go in the
 * content column; the image is pulled into the media column. Pass
 * mediaFirst=true to place the image on the left (source About layout).
 */
function buildIntroLayout(group, img, mediaFirst) {
  const anchor = group[0];
  const intro = document.createElement('div');
  intro.className = mediaFirst ? 'landing-intro media-first' : 'landing-intro';
  const content = document.createElement('div');
  content.className = 'landing-intro-content';
  const media = document.createElement('div');
  media.className = 'landing-intro-media';

  anchor.parentElement.insertBefore(intro, anchor);
  group.forEach((el) => {
    if (el !== img) content.append(el);
  });
  media.append(img);
  intro.append(mediaFirst ? media : content, mediaFirst ? content : media);
}

/**
 * On landing pages, lays out an intro heading + text/link beside its image
 * as two columns, matching the source design. Handles three shapes:
 *  1. section-opening h2 whose intro text is followed by an image (image right)
 *  2. an image paragraph immediately before the section's first h2 (image left,
 *     e.g. About "Our Mission")
 *  3. a lead h3 subsection directly after the first h2 that holds an image
 *     (image right, e.g. News "Newsroom")
 * No-ops when no adjacent image is present.
 */
function decorateLandingIntro(main) {
  main.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    const h2 = wrapper.querySelector(':scope > h2');
    if (!h2) return;

    // Shape 2: image paragraph directly before the first h2 (image left).
    const before = h2.previousElementSibling;
    if (isImageParagraph(before)) {
      const group = [before, h2];
      let sib = h2.nextElementSibling;
      while (sib && !/^H[1-6]$/.test(sib.tagName)) {
        group.push(sib);
        sib = sib.nextElementSibling;
      }
      buildIntroLayout(group, before, true);
      return;
    }

    // Shape 1: h2 intro — h2 + text/link, then an image (image right).
    const group = [h2];
    let img = null;
    let sib = h2.nextElementSibling;
    while (sib && !/^H[1-6]$/.test(sib.tagName)) {
      if (isImageParagraph(sib)) {
        img = sib;
        break;
      }
      group.push(sib);
      sib = sib.nextElementSibling;
    }
    if (img) {
      group.push(img);
      buildIntroLayout(group, img, false);
      return;
    }

    // Shape 3: lead h3 subsection right after the section's opening h2,
    // holding an image (e.g. News "Newsroom"). Image may come first.
    const h3 = h2.nextElementSibling;
    if (!h3 || h3.tagName !== 'H3') return;
    const h3Group = [h3];
    let h3Img = null;
    let s = h3.nextElementSibling;
    while (s && !/^H[1-6]$/.test(s.tagName)) {
      if (isImageParagraph(s)) h3Img = s;
      h3Group.push(s);
      s = s.nextElementSibling;
    }
    if (h3Img) buildIntroLayout(h3Group, h3Img, false);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateLandingIntro(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

/**
 * Prepends the demo simulation banner to the page.
 */
function addDemoBanner() {
  if (document.querySelector('.demo-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'demo-banner';
  banner.innerHTML = '<span class="demo-banner-icon" aria-hidden="true">🔁</span>'
    + '<span class="demo-banner-text">Demo simulation — not an official government website</span>'
    + '<span class="demo-banner-sep" aria-hidden="true">·</span>'
    + '<span class="demo-banner-powered">Powered by Adobe Experience Manager - Experience Modernization Agent</span>';
  document.body.prepend(banner);
}

async function loadPage() {
  addDemoBanner();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
