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

const DEFAULT_TEMPLATE = 'legacy';

const LCP_BLOCKS = ['hero', 'product-reference', 'product-support']; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'mammotome'; // add your RUM generation information here

// Define the custom audiences mapping for experimentation
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

/**
 * Creates an optimized background image for the given section.
 * The image is created for the given breakpoints.
 * Default breakpoints are mobile, tablet and desktop.
 * @param section The section to create the background image for
 * @param bgImage The background image to optimize
 * @param breakpoints The breakpoints to optimize the image for
 */
function createOptimizedBackgroundImage(section, bgImage, breakpoints = [{ width: '450' }, { media: '(min-width: 450px)', width: '750' }, { media: '(min-width: 750px)', width: '2000' }]) {
  const url = new URL(bgImage, window.location.href);
  const pathname = encodeURI(url.pathname);

  const images = breakpoints.map((br, i) => `url(${pathname}?width=${br.width}&format=webply&optimize=medium) ${i + 1}x`);
  section.style.backgroundImage = `image-set(${images.join(', ')})`;
  section.style.backgroundSize = 'cover';
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
    decorateHistorySection(main);
    observeHistorySection(main);
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

function integrateMartech(parent, id) {
  // Google Tag Manager
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  script.async = true;
  parent.appendChild(script);
}

/**
 * Loads the CSS and JavaScript for a given template, and executes the template's default function.
 * The CSS and JavaScript are loaded asynchronously, and any errors are logged to the console.
 *
 * @async
 * @param {Document} doc - The Document in which the template will be loaded.
 * @param {string} templateName - The name of the template to be loaded.
 * @throws {Error} Will throw an error if the template loading fails.
 */
async function loadTemplate(doc, templateName) {
  try {
    // Create a new Promise that resolves once the CSS has loaded
    const cssLoaded = new Promise((resolve) => {
      loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/styles.css`, resolve);
    });

    // Create a new Promise that resolves once the template's default function has been executed
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          // Import the JavaScript module for the template
          const mod = await import(`../templates/${templateName}/script.js`);

          // If the module has a default function, execute it
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // Log any errors that occur while loading or executing the module
          console.error(`failed to load module for ${templateName}`, error);
        }
        // Resolve the Promise
        resolve();
      })();
    });

    // Wait for both the CSS and the module to load
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // Log any errors that occur while loading the template
    console.error(`failed to load block ${templateName}`, error);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element|Document} doc The container element
 */
async function loadLazy(doc) {
  const templateName = getMetadata('template') || DEFAULT_TEMPLATE;
  if (templateName) {
    await loadTemplate(doc, templateName);
  }

  const main = doc.querySelector('main');
  await loadBlocks(main);

  loadCSS('/styles/fonts.css', null);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await loadHeader(doc.querySelector('header'));
  await loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`, null);

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

  // Mark customer as having viewed the page once
  localStorage.setItem('franklin-visitor-returning', true);

  document.dispatchEvent(new Event('franklin.loadLazy_completed'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => integrateMartech(document.body, 'GTM-KNBZTHP'), 500);
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
