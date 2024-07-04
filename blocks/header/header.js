import {
  getMetadata,
  decorateIcons,
  translate,
  getProducts,
  setActiveLink,
  createDomStructure,
  decorateSupScript,
  getInfo,
  decorateSupScriptInTextBelow,
  readBlockConfig,
  sampleRUM,
} from '../../scripts/lib-franklin.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 1025px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function createMobileMenuControlsBlock() {
  const mobileMenuControls = document.createElement('li');
  mobileMenuControls.classList.add('mobile-menu-controls');

  const backButton = document.createElement('div');
  backButton.classList.add('mobile-menu-back');

  mobileMenuControls.addEventListener('click', (e) => {
    e.stopPropagation();
    backButton.closest('[aria-expanded]').setAttribute('aria-expanded', 'false');
    backButton.closest('[aria-expanded]').parentElement.classList.remove('nav-expanded');
  });

  mobileMenuControls.append(backButton);

  return mobileMenuControls;
}

function createOverflowDropdown(navSections) {
  const overflowDropdown = document.createElement('li');
  overflowDropdown.classList.add('nav-button', 'nav-overflow');
  const overflowButton = document.createElement('a');
  overflowButton.href = '#';
  overflowButton.textContent = '...';
  overflowDropdown.append(overflowButton);

  const overflowDropdownList = document.createElement('ul');
  overflowDropdownList.classList.add('nav-overflow-list');

  overflowDropdown.append(overflowDropdownList);

  const sections = Array.from(navSections.querySelectorAll(':scope > ul > li'));
  // add last three items to dropdown
  const overflowSections = sections.slice(sections.length - 3);
  overflowSections.forEach((section) => {
    overflowDropdownList.append(section.cloneNode(true));
  });
  return overflowDropdown;
}

function addNavigationLogoForScrollingPage(nav) {
  const [navBrandPrimary, navBrandSecondary] = nav.querySelectorAll('.nav-brand > p');

  if (!navBrandPrimary) return;

  const homePageLink = navBrandPrimary.querySelector('a');
  homePageLink.setAttribute('aria-label', 'Navigate to homepage');

  const scrollingLogo = document.createElement('span');
  scrollingLogo.className = 'logo-hidden scrolling-logo icon icon-logo-small';
  scrollingLogo.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-logo-small"></use></svg>';

  const defaultLogo = homePageLink.firstChild;

  homePageLink.append(scrollingLogo);

  if (navBrandSecondary) {
    navBrandSecondary.classList.add('nav-brand-text');
  }

  // Simple debounce function to improve scroll performance
  let timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const isScrolled = window.scrollY > 40;
      nav.classList.toggle('narrow', isScrolled);
      defaultLogo.classList.toggle('logo-hidden', isScrolled);
      scrollingLogo.classList.toggle('logo-hidden', !isScrolled);
      if (navBrandSecondary) {
        navBrandSecondary.classList.toggle('logo-hidden', isScrolled);
      }
    }, 50);
  });
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    if (!section.classList.contains('mobile-menu-controls')) {
      section.setAttribute('aria-expanded', expanded.toString());
    }
  });
  const searchElement = document.querySelector('.icon-search');
  if (searchElement) {
    searchElement.dispatchEvent(new Event(expanded ? 'disable' : 'enable'));
  }
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');

  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    nav.classList.remove('nav-mobile');
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', '0');
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    nav.classList.add('nav-mobile');
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

async function fetchSearchData({ queryIndex }) {
  if (!window.searchData) {
    const resp = await fetch(`${queryIndex}?limit=10000`);
    if (resp.ok) {
      const json = await resp.json();
      if (json.data) {
        window.searchData = json;
      } else {
        throw new Error('Fetching search data returned unknown format');
      }
    } else {
      throw new Error(`Fetching search data failed with: ${resp.status}`);
    }
  }
  return window.searchData.data;
}

async function fetchProductSupportSearchData({ country, language, productSupport }) {
  if (!window.productSearchData) {
    const products = await getProducts(country, language);
    window.productSearchData = products.flatMap(({
      Name, Description, Page, assets,
    }) => ([{
      title: Name,
      description: Description,
      path: `${productSupport}/${Page}`,
    }, ...assets.map((asset) => ({
      title: asset.Name,
      description: asset.Description,
      path: asset.URL,
    }))]));
  }
  return window.productSearchData;
}

async function search(value) {
  const info = getInfo();
  const searchData = await fetchSearchData(info);
  const productSupportData = await fetchProductSupportSearchData(info);
  return [...searchData, ...productSupportData]
    .filter((e) => `${e.title} ${e.description}`.toLowerCase().includes(value.toLowerCase()));
}

async function searchInput(event) {
  const { value: searchTerm, aside } = event.target;

  aside.innerHTML = '';

  const url = new URL(window.location);
  if (searchTerm.length >= 3) {
    url.searchParams.set('ee_search_query', searchTerm);
  } else {
    url.searchParams.delete('ee_search_query');
  }

  if (searchTerm.length >= 3) {
    const title = document.createElement('h1');
    title.classList.add('nav-search-result-title');
    title.textContent = `${await translate('navSearchResultsFor', 'Search Results for')}: ${searchTerm}`;
    aside.append(title);
    aside.insertAdjacentHTML('beforeend', '<div class="nav-search-result-title-divider"><span class="nav-search-result-title-divider-separator"/></div>');

    try {
      const hits = await search(searchTerm);
      if (hits.length > 0) {
        hits.forEach((hit) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('nav-search-wrapper');
          const searchTitle = document.createElement('h3');
          searchTitle.classList.add('nav-search-title');
          const searchLink = document.createElement('a');
          searchLink.href = hit.path;
          createDomStructure(decorateSupScript(hit.title), searchLink);
          const searchDescription = document.createElement('div');
          searchDescription.classList.add('nav-search-description');
          createDomStructure(decorateSupScript(hit.description), searchDescription);
          searchTitle.appendChild(searchLink);
          wrapper.appendChild(searchTitle);
          wrapper.appendChild(searchDescription);
          aside.appendChild(wrapper);
        });
        sampleRUM('search', { source: 'input.nav-search-input', target: searchTerm });
      } else {
        const searchTitle = document.createElement('h3');
        searchTitle.classList.add('nav-search-title');
        searchTitle.textContent = await translate('navSearchNoResult', 'No Result');
        aside.appendChild(searchTitle);
        sampleRUM('nullsearch', { source: 'input.nav-search-input', target: searchTerm });
      }
    } catch (error) {
      const searchTitle = document.createElement('h3');
      searchTitle.classList.add('nav-search-title');
      searchTitle.textContent = await translate('navSearchFailure', 'Search could not be completed at this time - please try again later.');
      aside.appendChild(searchTitle);
    }
    aside.insertAdjacentHTML('beforeend', '<div class="nav-search-result-title-divider"><span class="nav-search-result-title-divider-separator"/></div>');
  }
  // eslint-disable-next-line no-restricted-globals
  history.replaceState(null, '', url);
}

async function searchClick(event) {
  const { input, searchElement } = event.currentTarget;
  if (!input.active) {
    input.placeholder = await translate('navSearchPlaceholder', 'What are you looking for?');

    const inputContainer = document.createElement('div');
    inputContainer.classList.add('nav-search-input-container');
    inputContainer.appendChild(input);

    searchElement.prepend(inputContainer);
    searchElement.append(input.aside);
    input.active = true;
    input.focus();
  } else {
    input.active = false;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    searchElement.removeChild(input.parentElement);
    searchElement.removeChild(input.aside);
  }
  event.preventDefault();
}

function searchDisable(event) {
  if (event.currentTarget.input.active) {
    event.currentTarget.dispatchEvent(new Event('click', { bubbles: false }));
  }
}

async function decorateSearch(block) {
  const searchSection = block.querySelector('div.nav-tools > p > a > .icon-search');

  if (!searchSection) return;

  const aside = document.createElement('aside');
  aside.classList.add('nav-search-aside');

  const input = document.createElement('input');
  input.classList.add('nav-search-input');
  input.type = 'search';
  input.value = new URL(window.location).searchParams.get('ee_search_query');
  input.aside = aside;
  input.active = input.value;
  input.addEventListener('input', searchInput);

  const searchElement = document.createElement('div');
  searchElement.classList.add('nav-search');
  searchSection.input = input;
  searchSection.searchElement = searchElement;

  searchSection.parentElement.parentElement
    .replaceChild(searchElement, searchSection.parentElement);

  searchElement.appendChild(searchSection);

  searchSection.addEventListener('click', searchClick);

  searchSection.addEventListener('disable', searchDisable);

  if (input.active) {
    input.placeholder = await translate('navSearchPlaceholder', 'What are you looking for?');
    searchElement.prepend(input);
    searchElement.append(aside);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * decorate Language to include flag image in href
 * @param navSections
 */
function decorateLanguageNav(navSections) {
  const listItems = navSections.querySelectorAll('.nav-drop > ul > li');

  listItems.forEach((li) => {
    const picture = li.querySelector('picture');
    const a = li.querySelector('a');

    if (picture && a) {
      const href = a.getAttribute('href');
      const txt = a.innerHTML;

      li.innerHTML = '';
      const newA = document.createElement('a');

      newA.setAttribute('href', href);
      newA.appendChild(picture);
      newA.appendChild(document.createTextNode(txt));

      li.appendChild(newA);
    }
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navPath = getMetadata('nav') || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'sections', 'tools'];
    Array.from(nav.children).forEach((section, i) => {
      // first section is assigned to brand, last to tools
      if (i === 0) {
        section.classList.add(`nav-${classes[0]}`);
      } else if (i === nav.children.length - 1) {
        section.classList.add(`nav-${classes[classes.length - 1]}`);
      } else {
        const navSectionList = nav.querySelector('.nav-sections > ul');
        if (navSectionList) {
          const sectionMetaData = section.querySelector('div.section-metadata');
          let config = {};
          if (sectionMetaData) {
            config = readBlockConfig(sectionMetaData);
            sectionMetaData.remove();
          }
          Array.from(section.querySelectorAll('div > ul > li')).forEach((li, j) => {
            navSectionList.appendChild(li);
            if (config.style) {
              li.classList.add(`${config.style}`);
              if (config.style === 'nav-button' && j % 2) {
                li.querySelector('a').classList.add('button', 'secondary');
              } else {
                li.querySelector('a').classList.add('button', 'primary');
              }
            }
          });
        } else {
          section.classList.add(`nav-${classes[1]}`);
        }
      }
    });

    const navSections = nav.querySelector('.nav-sections');

    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.classList.length === 0) navSection.classList.add('nav-drop');
        if (navSection.querySelector('ul > li > ul > li > ul')) navSection.classList.add('nav-multi');
        navSection.querySelectorAll('ul > li > ul > li').forEach(element => {
          element.classList.add('nav-items');
        });
        navSection.querySelectorAll('ul > li > ul > li > ul').forEach(element => {
          element.classList.add('nav-subitems');
        });
        navSection.querySelectorAll('ul > li > ul > li > ul > li').forEach(element => {
          element.classList.add('nav-subitem');
        });
        const navList = navSection.querySelector('ul');
        if (navList) navList.prepend(createMobileMenuControlsBlock());

        navSection.addEventListener('click', (e) => {
          if (!isDesktop.matches && e.target.nextElementSibling) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';

            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            if (expanded) {
              navSection.parentElement.classList.remove('nav-expanded');
            } else {
              navSection.parentElement.classList.add('nav-expanded');
            }
          }
        });
      });

      // not using :has selector because it's not supported in FF (fixes https://github.com/hlxsites/mammotome/issues/499)
      const firstLevelLis = Array.from(nav.querySelectorAll('.nav-sections > ul > li'));
      const firstLevelLinks = firstLevelLis.filter((li) => li.querySelector('ul')).map((li) => li.querySelector('a'));

      firstLevelLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          if (!isDesktop.matches) {
            event.preventDefault();
          }
        });
      });

      navSections.querySelector('ul').prepend(createMobileMenuControlsBlock());
      navSections.querySelector('ul').append(createOverflowDropdown(navSections));
      decorateLanguageNav(navSections);
      const multiLevelNav = navSections.querySelectorAll('li.nav-multilevel > ul > li > ul > li a');
      setActiveLink(multiLevelNav, 'active');
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => {
      toggleMenu(nav, navSections);
      navSections.style.transition = 'right 300ms var(--mt-nav-transition-timing)';
    });
    nav.insertBefore(hamburger, nav.querySelector('.nav-tools'));

    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => {
      toggleMenu(nav, navSections, isDesktop.matches);
      navSections.style.transition = '';
    });

    const mobileCover = document.createElement('div');
    mobileCover.classList.add('nav-mobile-cover');
    nav.insertBefore(mobileCover, nav.querySelector('.nav-hamburger'));
    mobileCover.addEventListener('click', () => {
      block.querySelectorAll('[aria-expanded="true"]').forEach((expanded) => {
        expanded.setAttribute('aria-expanded', 'false');
      });
    });

    await decorateIcons(nav);
    await decorateSearch(nav);
    decorateSupScriptInTextBelow(nav);
    // add logo for scrolling page
    addNavigationLogoForScrollingPage(nav);

    // remove empty sections
    Array.from(nav.children).forEach((section) => {
      if (section.children.length === 1 && section.children[0].tagName === 'UL' && section.children[0].children.length === 0) {
        section.remove();
      }
    });

    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);
  }
}
