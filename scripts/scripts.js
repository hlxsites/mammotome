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
  toClassName, translate,
} from './lib-franklin.js';

import {
  decorateHistorySection,
  observeHistorySection,
} from './lib-history-section.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'mammotome'; // add your RUM generation information here

// ARC decorations icons
const ARC_BOTTOM_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1437 210.42">\n'
  + '    <path class="cls-1" d="M0,21.28V210.42H1437v-.11C784.82-93.55,0,21.28,0,21.28Z"/>\n'
  + '</svg>';

const ARC_TOP_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1437 210.42">\n'
+ '    <path class="cls-1" d="M0,21.28V210.42H1437v-.11C784.82-93.55,0,21.28,0,21.28Z" transform="translate(718.500000, 105.211150) scale(-1, -1) translate(-718.500000, -105.211150)" />\n'
+ '</svg>';

const HTML_ARROW_PREV = '<svg fill="rgba(129,51,151,1)" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 -120 600 600">\n'
  + '<path d="M97.141,225.92c0-8.095,3.091-16.192,9.259-22.366L300.689,9.27c12.359-12.359,32.397-12.359,44.751,0c12.354,12.354,12.354,32.388,0,44.748L173.525,225.92l171.903,171.909c12.354,12.354,12.354,32.391,0,44.744c-12.354,12.365-32.386,12.365-44.745,0l-194.29-194.281C100.226,242.115,97.141,234.018,97.141,225.92z"/>\n'
  + '</svg>';
const HTML_ARROW_NEXT = '<svg fill="rgba(129,51,151,1)" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 -120 600 600">\n'
  + '<path d="M345.441,248.292L151.154,442.573c-12.359,12.365-32.397,12.365-44.75,0c-12.354-12.354-12.354-32.391,0-44.744L278.318,225.92L106.409,54.017c-12.354-12.359-12.354-32.394,0-44.748c12.354-12.359,32.391-12.359,44.75,0l194.287,194.284c6.177,6.18,9.262,14.271,9.262,22.366C354.708,234.018,351.617,242.115,345.441,248.292z"/>\n'
  + '</svg>\n';

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
  const h1 = main.querySelector('h1');
  const h2 = main.querySelector('h2');
  const picture = main.querySelector('picture');

  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    const elems = [picture, h1];

    // optional H2 following the hero's H1
    if (h2 && h1.nextElementSibling === h2) {
      elems.push(h2);
    }

    const arc = document.createElement('div');
    arc.classList.add('hero-arc');
    arc.innerHTML = ARC_BOTTOM_SVG;

    elems.push(arc);

    section.append(buildBlock('hero', { elems }));
    main.prepend(section);
  }
}

/**
 * Build Prev Next Bottom Navigation
 * @param main
 * @returns {Promise<void>}
 */
async function buildPrevNext(main) {
  // Move Header link text into a DIV
  const moveHeaderLinkDiv = (el) => {
    const text = el.innerText;
    const newDiv = document.createElement('div');
    newDiv.classList.add('prev-next-header-link');
    newDiv.innerText = text;
    el.innerText = '';
    el.insertAdjacentElement('afterbegin', newDiv);
  };

  // Build prev next nav buttons
  const buildNavButtons = async (key, defaultText) => {
    const newDiv = document.createElement('div');
    newDiv.classList.add('prev-next-button');
    newDiv.innerText = await translate(key, defaultText);
    return newDiv;
  };

  // build nav only if prev-next is available
  const prevNext = main.querySelector('.columns.prev-next');
  if (prevNext) {
    const prevNextContainer = prevNext.firstElementChild;
    // Build Vertical Separator
    const verticalSeparator = document.createElement('div');
    verticalSeparator.classList.add('vertical-line');
    prevNextContainer.firstElementChild.insertAdjacentElement('afterend', verticalSeparator);

    // Get PREVIOUS and NEXT navigation elements
    const prevBox = prevNextContainer.firstElementChild.querySelector('a');
    const nextBox = prevNextContainer.lastElementChild.querySelector('a');

    // Build PREVIOUS navigation if available
    if (prevBox) {
      // Move header link into Div
      moveHeaderLinkDiv(prevBox);
      // Add Prev and Next button
      const prevButton = await buildNavButtons('navPreviousText', 'Previous');
      if (prevBox) prevBox.insertAdjacentElement('afterbegin', prevButton);
      // build left Arrow
      const leftArrow = document.createElement('div');
      leftArrow.classList.add('left-arrow');
      leftArrow.innerHTML = HTML_ARROW_PREV;
      if (prevBox) prevBox.insertAdjacentElement('afterbegin', leftArrow);
    }

    // Build NEXT navigation if available
    if (nextBox) {
      // Move header link into Div
      moveHeaderLinkDiv(nextBox);
      // Add Prev and Next button
      const nextButton = await buildNavButtons('navNextText', 'Next');
      nextBox.insertAdjacentElement('afterbegin', nextButton);

      // build right arrow
      const rightArrow = document.createElement('div');
      rightArrow.classList.add('right-arrow');
      rightArrow.innerHTML = HTML_ARROW_NEXT;
      nextBox.insertAdjacentElement('afterbegin', rightArrow);
    }
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildPrevNext(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
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
        section.style.backgroundImage = `url(${bgImage})`;
        section.style.backgroundSize = 'cover';
      }
    });

  Array.from(main.querySelectorAll('.section.arc-bottom, .section.arc-top'))
    .forEach((section) => {
      const arc = document.createElement('div');
      arc.classList.add('arc');
      if (section.classList.contains('arc-bottom')) {
        arc.innerHTML = ARC_BOTTOM_SVG;
        section.append(arc);
      } else if (section.classList.contains('arc-top')) {
        arc.innerHTML = ARC_TOP_SVG;
        section.prepend(arc);
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
 * @param {string} type The icon content type
 * @param {string} size The dimensions of the icon, e.g. 80x80
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
