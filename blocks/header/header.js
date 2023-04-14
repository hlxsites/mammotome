import { getMetadata, decorateIcons, getPlaceholderOrDefault } from '../../scripts/lib-franklin.js';

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
  });

  mobileMenuControls.append(backButton);

  return mobileMenuControls;
}

function addNavigationLogoForScrollingPage(nav) {
  const homePageLink = nav.querySelector('.nav-brand > p > a');
  const scrollingLogo = document.createElement('img');
  scrollingLogo.setAttribute('src', '/icons/logo-round.webp');
  scrollingLogo.setAttribute('class', 'scrolling-logo');
  scrollingLogo.setAttribute('height', '40px');
  scrollingLogo.setAttribute('width', '40px');
  scrollingLogo.classList.add('logo-hidden');

  const defaultLogo = homePageLink.firstChild;

  homePageLink.append(scrollingLogo);

  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    if (scrollPosition > 40) {
      nav.classList.add('narrow');
      defaultLogo.classList.add('logo-hidden');
      scrollingLogo.classList.remove('logo-hidden');
    } else {
      nav.classList.remove('narrow');
      defaultLogo.classList.remove('logo-hidden');
      scrollingLogo.classList.add('logo-hidden');
    }
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
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', '0');
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
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

async function fetchSearchData() {
  if (!window.searchData) {
    const resp = await fetch(`/${window.location.pathname.split('/')[1]}/query-index.json`);
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
  return window.searchData;
}

async function search(value) {
  const searchData = await fetchSearchData();
  return searchData.data
    .filter((e) => `${e.title} ${e.description}`.toLowerCase().includes(value.toLowerCase()));
}

async function searchInput(event) {
  const { value, aside } = event.target;

  aside.innerHTML = '';

  const url = new URL(window.location);
  if (value.length >= 3) {
    url.searchParams.set('ee_search_query', value);
  } else {
    url.searchParams.delete('ee_search_query');
  }

  if (value.length >= 3) {
    const title = document.createElement('h1');
    title.classList.add('nav-search-result-title');
    title.textContent = `${await getPlaceholderOrDefault('navSearchResultsFor', 'Search Results for')}: ${value}`;
    aside.append(title);
    aside.insertAdjacentHTML('beforeend', '<div class="nav-search-result-title-divider"><span class="nav-search-result-title-divider-separator"/></div>');

    try {
      const hits = await search(value);
      if (hits.length > 0) {
        hits.forEach((hit) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('nav-search-wrapper');
          const searchTitle = document.createElement('h3');
          searchTitle.classList.add('nav-search-title');
          const searchLink = document.createElement('a');
          searchLink.href = hit.path;
          searchLink.textContent = hit.title;
          const searchDescription = document.createElement('div');
          searchDescription.classList.add('nav-search-description');
          searchDescription.textContent = hit.description;
          searchTitle.appendChild(searchLink);
          wrapper.appendChild(searchTitle);
          wrapper.appendChild(searchDescription);
          aside.appendChild(wrapper);
        });
      } else {
        const searchTitle = document.createElement('h3');
        searchTitle.classList.add('nav-search-title');
        searchTitle.textContent = await getPlaceholderOrDefault('navSearchNoResult', 'No Result');
        aside.appendChild(searchTitle);
      }
    } catch (error) {
      const searchTitle = document.createElement('h3');
      searchTitle.classList.add('nav-search-title');
      searchTitle.textContent = await getPlaceholderOrDefault('navSearchFailure', 'Search could not be completed at this time - please try again later.');
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
    input.placeholder = await getPlaceholderOrDefault('navSearchPlaceholder', 'What are you looking for?');
    searchElement.prepend(input);
    searchElement.append(input.aside);
    input.active = true;
    input.focus();
  } else {
    input.active = false;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    searchElement.removeChild(input);
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
    input.placeholder = await getPlaceholderOrDefault('navSearchPlaceholder', 'What are you looking for?');
    searchElement.prepend(input);
    searchElement.append(aside);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
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
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        if (navSection.querySelector('ul > li > ul > li > ul')) navSection.classList.add('nav-multilevel');

        const navList = navSection.querySelector('ul');
        if (navList) navList.prepend(createMobileMenuControlsBlock());
        else {
          navSection.classList.add('nav-button');
        }

        navSection.addEventListener('click', () => {
          if (!isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';

            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });

      const firstLevelLinks = nav.querySelectorAll('.nav-sections > ul > li > a');
      firstLevelLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          if (!isDesktop.matches) {
            event.preventDefault();
          }
        });
      });

      navSections.querySelector('ul').prepend(createMobileMenuControlsBlock());
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.insertBefore(hamburger, nav.querySelector('.nav-tools'));

    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    const mobileCover = document.createElement('div');
    mobileCover.classList.add('nav-mobile-cover');
    nav.insertBefore(mobileCover, nav.querySelector('.nav-hamburger'));
    mobileCover.addEventListener('click', () => {
      block.querySelectorAll('[aria-expanded="true"]').forEach((expanded) => {
        expanded.setAttribute('aria-expanded', 'false');
      });
    });

    await decorateIcons(nav);
    decorateSearch(nav);

    // add logo for scroling page
    addNavigationLogoForScrollingPage(nav);

    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);
  }
}
