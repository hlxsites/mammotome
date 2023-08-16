import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  setLanguage,
  createMetadata,
  getMetadata,
  toClassName,
  decorateSupScriptInTextBelow,
} from './lib-franklin.js';

import {
  decorateHistorySection,
  observeHistorySection,
} from './lib-history-section.js';

const LCP_BLOCKS = ['hero', 'product-reference', 'product-support']; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'mammotome'; // add your RUM generation information here

// Define the custom audiences mapping for experimentation
// noinspection JSUnusedGlobalSymbols
const EXPERIMENTATION_CONFIG = {
  audiences: {
    device: {
      mobile: () => window.innerWidth < 600,
      desktop: () => window.innerWidth >= 600,
    },
    visitor: {
      new: () => !localStorage.getItem('franklin-visitor-returning'),
      returning: () => !!localStorage.getItem('franklin-visitor-returning'),
    },
  },
};

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector(':scope > div:first-child > h1');
  const h2 = main.querySelector(':scope > div:first-child > h2');
  const button = main.querySelector(':scope > div:first-child > p > a');
  const picture = main.querySelector(':scope > div:first-child picture');
  const overlayPicture = main.querySelector(':scope > div:first-of-type > p:nth-child(2) > picture');
  const metaData = main.querySelector(':scope > div:first-child .section-metadata');

  const setHeroType = (heroType) => {
    const heroBlock = main.querySelector('.hero');
    heroBlock.classList.add(`hero-${heroType}`);
  };

  function doBuildBlock(section, elems) {
    if (button) {
      elems.push(button);
    }

    section.append(buildBlock('hero', { elems }));
    if (metaData) {
      section.append(metaData);
    }

    main.prepend(section);
  }

  // eslint-disable-next-line no-bitwise,max-len
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    const elems = [picture];

    if (overlayPicture) {
      elems.push(overlayPicture);
    }

    elems.push(h1);

    if (h2 && h1.nextElementSibling === h2) {
      elems.push(h2);
    }

    doBuildBlock(section, elems);
    setHeroType('big');
    // eslint-disable-next-line max-len,no-bitwise
  } else if (h1 && h2 && picture && (h2.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_FOLLOWING)) {
    // Hero light version
    const section = document.createElement('div');
    const elems = [h1];

    if (h2 && h1.nextElementSibling === h2) {
      elems.push(h2);
    }

    doBuildBlock(section, elems);
    setHeroType('light');
    // position PICTURE to the right place for hero light
    const newPictureParent = main.querySelector('.hero-light').firstChild;
    const newPictureDiv = document.createElement('div');
    newPictureDiv.appendChild(picture);
    newPictureParent.appendChild(newPictureDiv);
  } else if (h2 && picture
    // eslint-disable-next-line no-bitwise
    && (h2.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');

    const elems = [picture];

    if (overlayPicture) {
      elems.push(overlayPicture);
    }

    elems.push(h2);

    doBuildBlock(section, elems);
    setHeroType('big');
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`, null);
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
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

const resizeListeners = new WeakMap();

/**
 * Sets an optimized background image for a given section element.
 * This function takes into account the device's viewport width and device pixel ratio
 * to choose the most appropriate image from the provided breakpoints.
 *
 * @param {HTMLElement} section - The section element to which the background image will be applied.
 * @param {string} bgImage - The base URL of the background image.
 * @param {Array<{width: string, media?: string}>} [breakpoints=[
 *  { width: '450' },
 *  { media: '(min-width: 450px)', width: '750' },
 *  { media: '(min-width: 750px)', width: '2000' }
 * ]] - An array of breakpoint objects. Each object contains a `width` which is the width of the
 * image to request, and an optional `media` which is a media query string indicating when this
 * breakpoint should be used.
 */
function createOptimizedBackgroundImage(section, bgImage, breakpoints = [{ width: '450' }, { media: '(min-width: 450px)', width: '750' }, { media: '(min-width: 750px)', width: '2000' }]) {
  const updateBackground = () => {
    const url = new URL(bgImage, window.location.href);
    const pathname = encodeURI(url.pathname);

    // Filter all matching breakpoints
    const matchedBreakpoints = breakpoints
      .filter((br) => !br.media || window.matchMedia(br.media).matches);

    // If there are any matching breakpoints, pick the one with the highest resolution
    let matchedBreakpoint;
    if (matchedBreakpoints.length) {
      matchedBreakpoint = matchedBreakpoints
        .reduce((acc, curr) => (parseInt(curr.width, 10) > parseInt(acc.width, 10) ? curr : acc));
    } else {
      [matchedBreakpoint] = breakpoints;
    }

    const adjustedWidth = matchedBreakpoint.width * window.devicePixelRatio;
    section.style.backgroundImage = `url(${pathname}?width=${adjustedWidth}&format=webply&optimize=medium)`;
    section.style.backgroundSize = 'cover';
  };

  // If a listener already exists for this section, remove it to prevent duplicates.
  if (resizeListeners.has(section)) {
    window.removeEventListener('resize', resizeListeners.get(section));
  }

  // Store the updateBackground function in the WeakMap for this section
  resizeListeners.set(section, updateBackground);

  // Now, attach the new listener
  window.addEventListener('resize', updateBackground);

  // Immediately update the background
  updateBackground();
}

/**
 * Finds all sections in the main element of the document
 * that require additional decoration: adding
 * a background image or an arc effect.
 * @param {Element} main
 */
function decorateStyledSections(main) {
  Array.from(main.querySelectorAll('.section[data-background-image]'))
    .forEach((section) => {
      const bgImage = section.dataset.backgroundImage;
      if (bgImage) {
        createOptimizedBackgroundImage(section, bgImage);
      }
    });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export async function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  await decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateStyledSections(main);
  decorateBlocks(main);
  decorateSupScriptInTextBelow(main);

  if (main.querySelector('.section.our-history')) {
    await decorateHistorySection(main);
    await observeHistorySection(main);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element|Document} doc The container element
 */
async function loadEager(doc) {
  setLanguage();
  decorateTemplateAndTheme();

  // load experiments
  const experiment = toClassName(getMetadata('experiment'));
  const instantExperiment = getMetadata('instant-experiment');
  if (instantExperiment || experiment) {
    const { runExperiment } = await import('./experimentation/index.js');
    await runExperiment(experiment, instantExperiment, EXPERIMENTATION_CONFIG);
  }

  const main = doc.querySelector('main');
  if (main) {
    await decorateMain(main);
    await waitForLCP(LCP_BLOCKS);

    try {
      /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
      if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
        loadFonts();
      }
    } catch (e) {
      // do nothing
    }
  }
}

/**
 * Adds a favicon.
 * @param {string} href The favicon URL
 * @param {string} rel The icon rel
 */
export function addFavIcon(
  href,
  rel = 'icon',
) {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;

  const existingLink = document.querySelector(`head link[rel="${rel}"]`);
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element|Document} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await loadHeader(doc.querySelector('header'));
  await loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`, null);
  loadFonts();

  addFavIcon(`${window.hlx.codeBasePath}/styles/icons/favicon-32x32.png`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/icons/favicon-180x180.png`, 'apple-touch-icon');
  createMetadata('msapplication-TileImage', `${window.hlx.codeBasePath}/styles/icons/favicon-270x270.png`);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));

  // Load experimentation preview overlay
  if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.hlx.page')) {
    const preview = await import(`${window.hlx.codeBasePath}/tools/preview/preview.js`);
    await preview.default();
    if (window.hlx.experiment) {
      const experimentation = await import(`${window.hlx.codeBasePath}/tools/preview/experimentation.js`);
      experimentation.default();
    }
  }

  // as per https://github.com/adobe/franklin-rum-conversion
  const context = {
    getMetadata,
    toClassName,
  };
  // eslint-disable-next-line import/no-relative-packages
  const { initConversionTracking } = await import('../plugins/rum-conversion/src/index.js');
  await initConversionTracking.call(context, document, '');

  // Mark customer as having viewed the page once
  localStorage.setItem('franklin-visitor-returning', Boolean(true).toString());

  document.dispatchEvent(new Event('franklin.loadLazy_completed'));
}

// google tag manager
function loadGTM() {
  if (window.location.hostname.includes('localhost') || document.location.hostname.includes('.hlx.page')) {
    return;
  }

  const scriptTag = document.createElement('script');
  scriptTag.innerHTML = `
  // googleTagManager
  (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({
          'gtm.start':
              new Date().getTime(), event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src =
          'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-KNBZTHP');
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('set', {
      'cookie_flags': 'SameSite=None;Secure'
  });
  `;
  document.head.prepend(scriptTag);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => loadGTM(), 500);
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

await loadPage();
