import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

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

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
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
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
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
    const json = await resp.json();
    window.searchData = json;
  }
  return window.searchData;
}

async function search(value) {
  const searchData = await fetchSearchData();
  const hits = [];
  for (let i = 0; i < searchData.data.length; i += 1) {
    const e = searchData.data[i];
    const text = [e.title, e.description].join(' ').toLowerCase();
    if (text.includes(value.toLowerCase())) {
      hits.push(e);
    }
  }
  return hits;
}

function decorateSearch(block) {
  const searchSection = block.querySelector('a > .icon-search');
  if (searchSection) {
    const searchElement = document.createElement('div');
    searchElement.classList.add('nav-search');
    searchSection.parentElement.parentElement
      .replaceChild(searchElement, searchSection.parentElement);
    searchElement.appendChild(searchSection);

    const aside = document.createElement('aside');
    aside.classList.add('nav-search-aside');
    aside.classList.add('nav-search-aside-empty');

    const input = document.createElement('input');
    input.classList.add('nav-search-input');
    input.type = 'search';
    input.value = new URL(window.location).searchParams.get('ee_search_query');

    input.addEventListener('input', async (e) => {
      const url = new URL(window.location);
      if (e.target.value.length >= 3) {
        url.searchParams.set('ee_search_query', e.target.value);
        const hits = await search(e.target.value);
        if (hits.length > 0) {
          aside.classList.remove('nav-search-aside-empty');
          aside.innerHTML = `<h1 class="nav-search-result-title">Search Results for: ${input.value}</h1>
          <div class="nav-search-result-title-divider"><span class="nav-search-result-title-divider-separator"/></div>`;
        } else {
          aside.classList.add('nav-search-aside-empty');
          aside.innerHTML = '';
        }
        hits.forEach((hit) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('nav-search-wrapper');
          wrapper.innerHTML = `<h3 class='nav-search-title'><a href='${hit.path}'>${hit.title}</a></h3>
          <div class='nav-search-description'>${hit.description}</div>`;
          aside.appendChild(wrapper);
        });
      } else {
        url.searchParams.delete('ee_search_query');
        aside.innerHTML = '';
        aside.classList.add('nav-search-aside-empty');
      }
      // eslint-disable-next-line no-restricted-globals
      history.replaceState(null, '', url);
    });

    let active = input.value;

    if (active) {
      searchElement.prepend(input);
      searchElement.append(aside);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    searchSection.addEventListener('click', (event) => {
      if (!active) {
        searchElement.prepend(input);
        searchElement.append(aside);
        input.focus();
        active = true;
      } else {
        searchElement.removeChild(input);
        searchElement.removeChild(aside);
        active = false;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      event.preventDefault();
    });

    searchSection.addEventListener('disable', () => {
      if (active) {
        searchSection.dispatchEvent(new Event('click', { bubbles: false }));
      }
    });
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
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    decorateIcons(nav);

    decorateSearch(nav);

    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);
  }
}
