/* eslint-disable max-classes-per-file */
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const PDF_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">'
  + '<!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) -->'
  + '<path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"/>'
  + '</svg>';

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */
export function sampleRUM(checkpoint, data = {}) {
  sampleRUM.defer = sampleRUM.defer || [];
  const defer = (fnname) => {
    sampleRUM[fnname] = sampleRUM[fnname] || ((...args) => sampleRUM.defer.push({ fnname, args }));
  };
  sampleRUM.drain = sampleRUM.drain
    || ((dfnname, fn) => {
      sampleRUM[dfnname] = fn;
      sampleRUM.defer
        .filter(({ fnname }) => dfnname === fnname)
        .forEach(({ fnname, args }) => sampleRUM[fnname](...args));
    });
  sampleRUM.always = sampleRUM.always || [];
  sampleRUM.always.on = (chkpnt, fn) => {
    sampleRUM.always[chkpnt] = fn;
  };
  sampleRUM.on = (chkpnt, fn) => {
    sampleRUM.cases[chkpnt] = fn;
  };
  defer('observe');
  defer('cwv');
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum) {
      const usp = new URLSearchParams(window.location.search);
      const weight = usp.get('rum') === 'on' ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
      const id = Array.from({ length: 75 }, (_, i) => String.fromCharCode(48 + i))
        .filter((a) => /\d|[A-Z]/i.test(a))
        .filter(() => Math.random() * 75 > 70)
        .join('');
      const random = Math.random();
      const isSelected = random * weight < 1;
      const firstReadTime = Date.now();
      const urlSanitizers = {
        full: () => window.location.href,
        origin: () => window.location.origin,
        path: () => window.location.href.replace(/\?.*$/, ''),
      };
      // eslint-disable-next-line object-curly-newline, max-len
      window.hlx.rum = {
        weight,
        id,
        random,
        isSelected,
        firstReadTime,
        sampleRUM,
        sanitizeURL: urlSanitizers[window.hlx.RUM_MASK_URL || 'path'],
      };
    }
    const { weight, id, firstReadTime } = window.hlx.rum;
    if (window.hlx && window.hlx.rum && window.hlx.rum.isSelected) {
      const knownProperties = [
        'weight',
        'id',
        'referer',
        'checkpoint',
        't',
        'source',
        'target',
        'cwv',
        'CLS',
        'FID',
        'LCP',
        'INP',
      ];
      const sendPing = (pdata = data) => {
        // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
        const body = JSON.stringify(
          {
            weight,
            id,
            referer: window.hlx.rum.sanitizeURL(),
            checkpoint,
            t: Date.now() - firstReadTime,
            ...data,
          },
          knownProperties,
        );
        const url = `https://rum.hlx.page/.rum/${weight}`;
        // eslint-disable-next-line no-unused-expressions
        navigator.sendBeacon(url, body);
        // eslint-disable-next-line no-console
        console.debug(`ping:${checkpoint}`, pdata);
      };
      sampleRUM.cases = sampleRUM.cases || {
        cwv: () => sampleRUM.cwv(data) || true,
        lazy: () => {
          // use classic script to avoid CORS issues
          const script = document.createElement('script');
          script.src = 'https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@^1/src/index.js';
          document.head.appendChild(script);
          return true;
        },
      };
      sendPing(data);
      if (sampleRUM.cases[checkpoint]) {
        sampleRUM.cases[checkpoint]();
      }
    }
    if (sampleRUM.always[checkpoint]) {
      sampleRUM.always[checkpoint](data);
    }
  } catch (error) {
    // something went wrong
  }
}

const HEAD_RESOURCE_TYPES = {
  LINK: {
    tagName: 'link',
    attributes: [['rel', 'stylesheet']],
    sourceAttribute: 'href',
  },
  SCRIPT: {
    tagName: 'script',
    attributes: [],
    sourceAttribute: 'src',
  },
};

const loadHeadResource = (href, type, callback) => {
  if (!document.querySelector(`head > ${type.tagName}[${type.sourceAttribute}="${href}"]`)) {
    const element = document.createElement(type.tagName);
    element.setAttribute(type.sourceAttribute, href);
    type.attributes.forEach((attribute) => {
      element.setAttribute(attribute[0], attribute[1]);
    });

    if (typeof callback === 'function') {
      element.onload = (e) => callback(e.type);
      element.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(element);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
};

export function loadScript(href, callback) {
  loadHeadResource(href, HEAD_RESOURCE_TYPES.SCRIPT, callback);
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 * @param {function} callback A function called after CSS is loaded
 */
export function loadCSS(href, callback) {
  loadHeadResource(href, HEAD_RESOURCE_TYPES.LINK, callback);
}

/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

export function createMetadata(name, value) {
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', value);

  document.head.append(meta);
}

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

/**
 * Sanitizes a string for use as a js property name.
 * @param {string} name The unsanitized string
 * @returns {string} The camelCased name
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Gets all the metadata elements that are in the given scope.
 * @param {String} scope The scope/prefix for the metadata
 * @returns an array of HTMLElement nodes that match the given scope
 */
export function getAllMetadata(scope) {
  return [...document.head.querySelectorAll(`meta[property^="${scope}:"],meta[name^="${scope}-"]`)]
    .reduce((res, meta) => {
      const id = toClassName(meta.name
        ? meta.name.substring(scope.length + 1)
        : meta.getAttribute('property').split(':')[1]);
      res[id] = meta.getAttribute('content');
      return res;
    }, {});
}

const ICONS_CACHE = {};
/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} [element] Element containing icons
 */
export async function decorateIcons(element) {
  // Prepare the inline sprite
  let svgSprite = document.getElementById('franklin-svg-sprite');
  if (!svgSprite) {
    const div = document.createElement('div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
    svgSprite = div.firstElementChild;
    document.body.append(div.firstElementChild);
  }

  // Download all new icons
  const icons = [...element.querySelectorAll('span.icon')];
  await Promise.all(icons.map(async (span) => {
    const iconName = Array.from(span.classList).find((c) => c.startsWith('icon-')).substring(5);
    if (!ICONS_CACHE[iconName]) {
      ICONS_CACHE[iconName] = true;
      try {
        const response = await fetch(`${window.hlx.codeBasePath}/icons/${iconName}.svg`);
        if (!response.ok) {
          ICONS_CACHE[iconName] = false;
          return;
        }
        // Styled icons don't play nice with the sprite approach because of shadow dom isolation
        const svg = await response.text();
        if (svg.match(/(<style | class=)/)) {
          ICONS_CACHE[iconName] = { styled: true, html: svg };
        } else {
          ICONS_CACHE[iconName] = {
            html: svg
              .replace('<svg', `<symbol id="icons-sprite-${iconName}"`)
              .replace(/ width=".*?"/, '')
              .replace(/ height=".*?"/, '')
              .replace('</svg>', '</symbol>'),
          };
        }
      } catch (error) {
        ICONS_CACHE[iconName] = false;
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }));

  const symbols = Object.values(ICONS_CACHE).filter((v) => !v.styled).map((v) => v.html).join('\n');
  svgSprite.innerHTML += symbols;

  icons.forEach((span) => {
    const iconName = Array.from(span.classList).find((c) => c.startsWith('icon-')).substring(5);
    const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;

    // Set aria-label if the parent is an anchor tag
    const spanParent = span.parentElement;
    if (spanParent.tagName === 'A' && !spanParent.hasAttribute('aria-label')) {
      spanParent.setAttribute('aria-label', iconName);
    }

    // Styled icons need to be inlined as-is, while unstyled ones can leverage the sprite
    if (ICONS_CACHE[iconName] && ICONS_CACHE[iconName].styled) {
      parent.innerHTML = ICONS_CACHE[iconName].html;
    } else {
      parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-${iconName}"/></svg>`;
    }
  });
}

/**
 * Creates a (nested) dom structure based on a given template and appends or prepends
 * it to a given parentElement (default is the document body).
 * @param {object} structure The template
 * @param {object} parentElement The dom element to append or prepend to.
 */
export function createDomStructure(structure, parentElement = document.body) {
  structure.forEach((element) => {
    const domElement = document.createElement(element.type);
    if (element.attributes) {
      Object.keys(element.attributes).forEach((attr) => {
        domElement.setAttribute(attr, element.attributes[attr]);
      });
    }

    if (element.textContent) {
      domElement.textContent = element.textContent;
    }

    if (element.children) {
      createDomStructure(element.children, domElement);
    }

    if (element.classes) {
      element.classes.forEach((c) => domElement.classList.add(c));
    }

    if (element.position === 'prepend') {
      parentElement.prepend(domElement);
    } else {
      parentElement.appendChild(domElement);
    }
  });
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  const loaded = window.placeholders[`${prefix}-loaded`];
  if (!loaded) {
    window.placeholders[`${prefix}-loaded`] = new Promise((resolve, reject) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          throw new Error(`${resp.status}: ${resp.statusText}`);
        }).then((json) => {
          const placeholders = {};
          if (json[':type'] === 'multi-sheet') {
            json[':names'].forEach((name) => {
              placeholders[name] = {};
              json[name].data
                .filter((placeholder) => placeholder.Key && placeholder.Text)
                .forEach((placeholder) => {
                  placeholders[name][toCamelCase(placeholder.Key)] = placeholder.Text;
                });
            });
          } else {
            json.data
              .filter((placeholder) => placeholder.Key && placeholder.Text)
              .forEach((placeholder) => {
                placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
              });
          }
          window.placeholders[prefix] = placeholders;
          resolve();
        }).catch((error) => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          reject(error);
        });
    });
  }
  await window.placeholders[`${prefix}-loaded`];
  return window.placeholders[prefix];
}

async function getPlaceHolder(root, key) {
  const placeholders = await fetchPlaceholders();
  if (placeholders[root] && placeholders[root][key]) {
    return placeholders[root][key];
  }
  throw new Error('undefined');
}

export async function getConfigValue(key, defaultValue) {
  try {
    return await getPlaceHolder('config', key);
  } catch (error) {
    return defaultValue;
  }
}

export async function translate(key, defaultText) {
  const i18n = `i18n-${window.location.pathname.split('/')[1]}`;
  const i18nDefault = 'i18n-en';
  try {
    return await getPlaceHolder(i18n, key, defaultText);
  } catch (error) { /* empty */ }
  if (i18n !== i18nDefault) {
    try {
      return await getPlaceHolder(i18nDefault, key);
    } catch (error) { /* empty */ }
  }
  return defaultText;
}

export function decorateSupScript(string, result = [], inside = false, first = true) {
  if (!string) {
    return result;
  }
  if (inside && first && ['TM', 'tm'].includes(string)) {
    result.push(
      {
        type: 'span',
        textContent: string,
        classes: ['tm'],
      },
    );
    return result;
  }

  const idx = string.search(/®|™|©/);

  if (idx !== -1) {
    const sup = string.substr(idx, 1);
    const tm = sup === '™';
    result.push(
      {
        type: 'span',
        textContent: string.substr(0, idx),
      },
      {
        type: inside ? 'span' : 'sup',
        textContent: tm ? 'TM' : sup,
        classes: tm ? ['tm'] : undefined,
      },
    );

    return decorateSupScript(string.substr(idx + 1), result, inside, false);
  }

  result.push({
    type: 'span',
    textContent: string,
  });

  return result;
}

function walkNodeTree(root, { inspect, collect, callback } = {}) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ALL,
    {
      acceptNode(node) {
        if (inspect && !inspect(node)) { return NodeFilter.FILTER_REJECT; }
        if (collect && !collect(node)) { return NodeFilter.FILTER_SKIP; }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let n = walker.nextNode();
  while (n) {
    const next = walker.nextNode();
    callback?.(n);
    n = next;
  }
}

/* depending on the content length amount of work in decorateSupScriptInTextBelow might cause the
  * entire caller function to block main-thread more than 50ms to finish. For that reason and to
  * prevent future content-led perf. degradations, decorateSupScriptInTextBelow function should
  * run in a separate event-loop task
  */
export function decorateSupScriptInTextBelow(el) {
  return new Promise((resolve) => {
    setTimeout(() => {
      walkNodeTree(el, {
        inspect: (n) => !['STYLE', 'SCRIPT'].includes(n.nodeName),
        collect: (n) => (n.nodeType === Node.TEXT_NODE),
        callback: (n) => {
          const inside = n.parentElement.tagName === 'SUP';
          const result = decorateSupScript(n.textContent, [], inside);
          if (result.length > 1) {
            const replacementNode = document.createElement('span');
            const newHtml = result.filter((p) => p.textContent !== '').map((p) => `<${p.type}${p.classes ? ` class=${p.classes.join()}` : ''}>${p.textContent}</${p.type}>`).join('');
            n.parentNode.insertBefore(replacementNode, n);
            n.parentNode.removeChild(n);
            replacementNode.outerHTML = newHtml;
          } else if (inside && result.length === 1 && result[0].classes?.includes('tm')) {
            n.parentElement.classList.add('tm');
          }
        },
      });
      resolve();
    }, 0);
  });
}

export function getInfo() {
  const [, country, language] = window.location.pathname.split('/');
  const getUrlPath = (path) => new URL(path, origin).pathname;

  return {
    country,
    language,
    productDB: getUrlPath('/products.json'),
    productSupport: getUrlPath(`/${country}/${language}/product-support`),
    queryIndex: getUrlPath(`/${country}/${language}/query-index.json`),
  };
}

export function adjustAssetURL(asset) {
  if (asset?.URL) {
    const url = new URL(asset.URL, window.location);
    const isLocalOrHlx = ['localhost', '-mammotome--hlxsites.hlx.page', '-mammotome--hlxsites.hlx.live']
      .some((domain) => url.hostname.endsWith(domain));

    if (isLocalOrHlx) {
      asset.URL = url.pathname;
    }
  }
  return asset;
}

export async function getProductDB() {
  if (!window.productDB) {
    const { productDB } = getInfo();
    const resp = await fetch(`${productDB}?limit=10000`);
    if (!resp.ok) {
      throw new Error(`${resp.status}: ${resp.statusText}`);
    }
    window.productDB = await resp.json();
    const adjustData = (f) => (field) => {
      if (window.productDB[field]?.data) {
        window.productDB[field].data = window.productDB[field].data.map(f);
      }
    };

    ['ProductAsset', 'eIFU'].forEach(adjustData(adjustAssetURL));
  }
  return window.productDB;
}

function productDBMatches(entry, country, language) {
  if (country && entry.Countries !== '') {
    const countries = entry.Countries.toUpperCase().split('|');
    if (!countries.includes(country.toUpperCase())) {
      return false;
    }
  }

  if (language && entry.Languages !== '') {
    const languages = entry.Languages.toUpperCase().split('|');
    if (!languages.includes(language.toUpperCase())) {
      return false;
    }
  }

  return true;
}

export async function getProduct(page, country, language) {
  const productDB = await getProductDB();

  const product = productDB.Product.data
    .find((entry) => entry.Page === page && productDBMatches(entry, country));

  if (product) {
    const translation = productDB.ProductTranslation.data
      .find((entry) => entry.Page === product.Page && productDBMatches(entry, country, language));

    product.Name = translation?.Name || product.Name;
    product.Description = translation?.Description || product.Description;
    product.Image = translation?.Image || product.Image;

    product.assets = productDB.ProductAsset.data.filter(
      (asset) => asset.Page === product.Page && productDBMatches(asset, country, language),
    );
  }

  return product;
}

export async function getProducts(country, language) {
  const productDB = await getProductDB();

  return (await Promise.all(productDB.Product.data
    .map(async (product) => getProduct(product.Page, country, language))))
    .filter((product) => product);
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const shortBlockName = block.classList[0];
  if (shortBlockName) {
    block.classList.add('block');
    block.dataset.blockName = shortBlockName;
    block.dataset.blockStatus = 'initialized';
    const blockWrapper = block.parentElement;
    blockWrapper.classList.add(`${shortBlockName}-wrapper`);
    const section = block.closest('.section');
    if (section) section.classList.add(`${shortBlockName}-container`);
  }
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll('img')];
          if (imgs.length === 1) {
            value = imgs[0].src;
          } else {
            value = imgs.map((img) => img.src);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param alt
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 * @param width default image width
 * @param height default image height
 */
export function createOptimizedPicture(src, alt = '', eager = false, width = null, height = null, breakpoints = [{ media: '(min-width: 750px)', width: '2000' }, { media: '(min-width: 450px)', width: '750' }, { width: '450' }]) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      if (width && height) {
        img.setAttribute('width', width);
        img.setAttribute('height', height);
      }
    }
  });

  return picture;
}

/**
 * Add a divider into section from Section Metadata block
 * @param section section element
 * @param type primary (grey) or secondary (blue)
 */
export function addDivider(section, type) {
  const divider = document.createElement('hr');
  divider.classList.add('divider', type);
  section.appendChild(divider);
}

/** Add a spacer into section from Section Metadata block
 * @param section section element
 * @param heightValue height of spacer in px
 * @param position after or before
 */
export function addSpacer(section, heightValue, position) {
  const spacerHeight = parseInt(heightValue, 10) || 0;
  const spacerDiv = document.createElement('div');
  section.classList.add('spacer');
  spacerDiv.setAttribute('style', `height: ${spacerHeight}px;`);
  if (position === 'before') {
    section.insertBefore(spacerDiv, section.firstChild);
  } else if (position === 'after') {
    section.appendChild(spacerDiv);
  }
}

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';
    section
      .querySelectorAll('img')
      .forEach((img) => img.closest('picture')
        .replaceWith(
          createOptimizedPicture(img.src, img.alt, false, img.width, img.height),
        ));

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = meta.style.split(',').map((style) => toClassName(style.trim()));
          styles.forEach((style) => style && section.classList.add(style));
        } else if (key === 'divider') { // add divider from section metadata
          const dividerMeta = meta.divider.split(',').map((divider) => toClassName(divider.trim()));
          const dividerType = dividerMeta[0] === 'secondary' ? 'secondary' : 'primary';
          addDivider(section, dividerType);
        } else if (key === 'spacer') {
          const spacerMeta = meta.spacer.split(',').map((spacer) => toClassName(spacer.trim()));
          const spacerValue = parseInt(spacerMeta[0], 10) || '0';
          if (spacerMeta.length > 1) {
            const spacerPositions = spacerMeta.slice(1, spacerMeta.length);
            spacerPositions.forEach((position) => {
              addSpacer(section, spacerValue, position.trim());
            });
          } else {
            addSpacer(section, spacerValue, 'after');
          }
        } else if (key === 'button-width') { // set fixed button width from section metadata
          const buttonWidthInt = parseInt(meta['button-width'], 10);
          const buttonWidth = buttonWidthInt ? `${buttonWidthInt}px` : '100%';
          const aButtons = section.querySelectorAll('p a');
          aButtons.forEach((aButton) => {
            aButton.setAttribute('style', `width: ${buttonWidth};`);
            aButton.classList.add('button-width');
          });
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      sectionMeta.parentNode.remove();
    }
  });
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
export function updateSectionsStatus(main) {
  const sections = [...main.querySelectorAll(':scope > div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const status = section.dataset.sectionStatus;
    if (status !== 'loaded') {
      const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
      if (loadingBlock) {
        section.dataset.sectionStatus = 'loading';
        break;
      } else {
        section.dataset.sectionStatus = 'loaded';
        section.style.display = null;
      }
    }
  }
}

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
export function decorateBlocks(main) {
  main
    .querySelectorAll('div.section > div > div')
    .forEach(decorateBlock);
}

/**
 * Builds a block DOM Element from a two-dimensional array, string, or object
 * @param {string} blockName name of the block
 * @param {*} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName);

  if (content === null) {
    return blockEl;
  }

  const table = Array.isArray(content) ? content : [[content]];

  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * Loads JS and CSS for a module and executes it's default export.
 * @param {string} name The module name
 * @param {string} jsPath The JS file to load
 * @param {string} [cssPath] An optional CSS file to load
 * @param {object[]} [args] Parameters to be passed to the default export when it is called
 */
async function loadModule(name, jsPath, cssPath, ...args) {
  const cssLoaded = cssPath
    ? new Promise((resolve) => { loadCSS(cssPath, resolve); })
    : Promise.resolve();
  const decorationComplete = jsPath
    ? new Promise((resolve) => {
      (async () => {
        let mod;
        try {
          mod = await import(jsPath);
          if (mod.default) {
            await mod.default.apply(null, args);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${name}`, error);
        }
        resolve(mod);
      })();
    })
    : Promise.resolve();
  return Promise.all([cssLoaded, decorationComplete])
    .then(([, api]) => api);
}

/**
 * Gets the configuration for the given block, and also passes
 * the config through all custom patching helpers added to the project.
 *
 * @param {Element} block The block element
 * @returns {Object} The block config (blockName, cssPath and jsPath)
 */
function getBlockConfig(block) {
  const { blockName } = block.dataset;
  const cssPath = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`;
  const jsPath = `${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`;
  const original = { blockName, cssPath, jsPath };
  return (window.hlx.patchBlockConfig || [])
    .filter((fn) => typeof fn === 'function')
    .reduce((config, fn) => fn(config, original), { blockName, cssPath, jsPath });
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */
export async function loadBlock(block) {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName, cssPath, jsPath } = getBlockConfig(block);
    try {
      await loadModule(blockName, jsPath, cssPath, block);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`failed to load block ${blockName}`, error);
    }
    block.dataset.blockStatus = 'loaded';
  }
}

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
export async function loadBlocks(main) {
  updateSectionsStatus(main);
  const blocks = [...main.querySelectorAll('div.block')];
  for (let i = 0; i < blocks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadBlock(blocks[i]);
    updateSectionsStatus(main);
  }
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {string} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level} id="${tag.id}">${tag.textContent}</h${level}>`;
      }
    }
  });
}

/**
 * Set template (page structure) and theme (page styles).
 */
export function decorateTemplateAndTheme() {
  const addClasses = (element, classes) => {
    classes.split(',').forEach((c) => {
      element.classList.add(toClassName(c.trim()));
    });
  };
  const template = getMetadata('template');
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme');
  if (theme) addClasses(document.body, theme);
}

/**
 * Set Link class to active when on the same page
 * @param links {NodeListOf<Element>} Array of links to check
 * @param className {string} Class to add to active link
 */
export function setActiveLink(links, className) {
  if (!links || links.length === 0) return;
  const ogUrl = getMetadata('og:url');
  const slicer = ogUrl.endsWith('/') ? -2 : -1;
  const actualPage = ogUrl.split('/').slice(slicer)[0].toLowerCase();
  links.forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href.includes(actualPage)) {
      a.classList.add(className);
    }
  });
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
export function decorateButtons(element) {
  const excludedParentClasses = ['.prev-next', '.tab-navigation'];

  const isSingleChild = (el, tagName) => el.childNodes.length === 1 && el.tagName === tagName;
  const addClassAndContainer = (el, a, className, containerClass) => {
    a.className = className;
    el.classList.add(containerClass);
  };
  const handlePdfLink = (a, parent, url) => {
    if (url.pathname.endsWith('.pdf')) {
      a.target = '_blank';
      if (parent.tagName.toLowerCase() === 'div' && parent.classList.contains('button-container')) {
        const icon = document.createElement('i');
        icon.classList.add('link-icon');
        icon.innerHTML = PDF_ICON;
        const spanText = document.createElement('span');
        spanText.innerHTML = a.innerHTML;
        a.innerHTML = '';
        a.append(icon, spanText);
      }
    }
  };

  element.querySelectorAll('a').forEach((a) => {
    // Suppress a-to-button decoration when in excludedParentClasses
    if (!excludedParentClasses.some((className) => a.closest(className))) {
      const parent = a.parentElement;
      const grandparent = parent.parentElement;

      a.title = a.title || a.textContent;
      a.setAttribute('aria-label', a.title);

      if (a.href !== a.textContent && !a.querySelector('img')) {
        if (isSingleChild(parent, 'P') || isSingleChild(parent, 'DIV')) {
          addClassAndContainer(parent, a, 'button primary', 'button-container');
        } else if (isSingleChild(parent, 'STRONG') && isSingleChild(grandparent, 'P')) {
          addClassAndContainer(grandparent, a, 'button primary', 'button-container');
        } else if (isSingleChild(parent, 'EM') && isSingleChild(grandparent, 'P')) {
          addClassAndContainer(grandparent, a, 'button secondary', 'button-container');
        }

        const url = new URL(a.href);
        handlePdfLink(a, parent, url);
      }
    }
  });
}

export function decorateBlockImgs(block) {
  block.querySelectorAll('img')
    .forEach((img) => {
      const { hostname } = new URL(img.src, window.location.href);
      if (hostname === window.location.hostname
        || hostname.endsWith('-mammotome--hlxsites.hlx.page')
        || hostname.endsWith('-mammotome--hlxsites.hlx.live')
        || hostname === 'localhost') {
        img.replaceWith(
          createOptimizedPicture(img.src, img.alt, false, img.width, img.height),
        );
      }
    });
}

/**
 * Load LCP block and/or wait for LCP in default content.
 */
export async function waitForLCP(lcpBlocks) {
  const block = document.querySelector('.block');
  const hasLCPBlock = (block && lcpBlocks.includes(block.dataset.blockName));
  if (hasLCPBlock) await loadBlock(block);

  document.body.style.display = null;
  const lcpCandidate = document.querySelector('main img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}

export const SUPPORTED_LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'pl'];
export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_COUNTRIES = ['de', 'es', 'fr', 'uk', 'it', 'pl', 'us', 'dj-test'];
export const DEFAULT_COUNTRY = 'us';

export function getPreferredLanguage() {
  return navigator.languages.find(
    (l) => SUPPORTED_LANGUAGES.includes(l),
  ) || DEFAULT_LANGUAGE;
}

export function getPreferredCountry() {
  return DEFAULT_COUNTRY;
}

export function setLanguage() {
  const [, country, language] = window.location.pathname.split('/');
  const preferredLanguage = SUPPORTED_LANGUAGES.includes(language)
    ? language : getPreferredLanguage();
  const preferredCountry = SUPPORTED_COUNTRIES.includes(country)
    ? country : getPreferredCountry();
  const preferredCountryAndLanguagePath = `/${preferredCountry}/${preferredLanguage}/`;

  if (window.location.pathname === '/' && window.location.origin.match(/\.hlx\.(page|live)$/)) {
    window.location.replace(preferredCountryAndLanguagePath);
  }

  document.documentElement.lang = language;

  createMetadata('nav', `${preferredCountryAndLanguagePath}nav`);
  createMetadata('footer', `${preferredCountryAndLanguagePath}footer`);
}

/**
 * Loads a block named 'header' into header
 * @param {Element} header header element
 * @returns {Promise}
 */
export async function loadHeader(header) {
  const headerBlock = buildBlock('header', null);
  header.append(headerBlock);
  decorateBlock(headerBlock);
  return loadBlock(headerBlock);
}

/**
 * Loads a block named 'footer' into footer
 * @param footer footer element
 * @returns {Promise}
 */
export async function loadFooter(footer) {
  const footerBlock = buildBlock('footer', null);
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  return loadBlock(footerBlock);
}

function parsePluginParams(id, config) {
  const pluginId = !config
    ? id.split('/').splice(id.endsWith('/') ? -2 : -1, 1)[0].replace(/\.js/, '')
    : id;
  const pluginConfig = {
    load: 'eager',
    ...(typeof config === 'string' || !config
      ? { url: (config || id).replace(/\/$/, '') }
      : config),
  };
  pluginConfig.options ||= {};
  return { id: pluginId, config: pluginConfig };
}

// Define an execution context for plugins
export const executionContext = {
  createOptimizedPicture,
  getAllMetadata,
  getMetadata,
  decorateBlock,
  decorateButtons,
  decorateIcons,
  loadBlock,
  loadCSS,
  loadScript,
  sampleRUM,
  toCamelCase,
  toClassName,
};

class PluginsRegistry {
  #plugins;

  constructor() {
    this.#plugins = new Map();
  }

  // Register a new plugin
  add(id, config) {
    const { id: pluginId, config: pluginConfig } = parsePluginParams(id, config);
    this.#plugins.set(pluginId, pluginConfig);
  }

  // Get the plugin
  get(id) { return this.#plugins.get(id); }

  // Check if the plugin exists
  includes(id) { return !!this.#plugins.has(id); }

  // Load all plugins that are referenced by URL, and updated their configuration with the
  // actual API they expose
  async load(phase) {
    [...this.#plugins.entries()]
      .filter(([, plugin]) => plugin.condition
      && !plugin.condition(document, plugin.options, executionContext))
      .map(([id]) => this.#plugins.delete(id));
    return Promise.all([...this.#plugins.entries()]
      // Filter plugins that don't match the execution conditions
      .filter(([, plugin]) => (
        (!plugin.condition || plugin.condition(document, plugin.options, executionContext))
        && phase === plugin.load && plugin.url
      ))
      .map(async ([key, plugin]) => {
        try {
          // If the plugin has a default export, it will be executed immediately
          const pluginApi = (await loadModule(
            key,
            !plugin.url.endsWith('.js') ? `${plugin.url}/${key}.js` : plugin.url,
            !plugin.url.endsWith('.js') ? `${plugin.url}/${key}.css` : null,
            document,
            plugin.options,
            executionContext,
          )) || {};
          this.#plugins.set(key, { ...plugin, ...pluginApi });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Could not load specified plugin', key);
        }
      }));
  }

  // Run a specific phase in the plugin
  async run(phase) {
    return [...this.#plugins.values()]
      .reduce((promise, plugin) => ( // Using reduce to execute plugins sequencially
        plugin[phase] && (!plugin.condition
            || plugin.condition(document, plugin.options, executionContext))
          ? promise.then(() => plugin[phase](document, plugin.options, executionContext))
          : promise
      ), Promise.resolve());
  }
}

class TemplatesRegistry {
  // Register a new template
  // eslint-disable-next-line class-methods-use-this
  add(id, url) {
    if (Array.isArray(id)) {
      id.forEach((i) => window.hlx.templates.add(i));
      return;
    }
    const { id: templateId, config: templateConfig } = parsePluginParams(id, url);
    templateConfig.condition = () => toClassName(getMetadata('template')) === templateId;
    window.hlx.plugins.add(templateId, templateConfig);
  }

  // Get the template
  // eslint-disable-next-line class-methods-use-this
  get(id) { return window.hlx.plugins.get(id); }

  // Check if the template exists
  // eslint-disable-next-line class-methods-use-this
  includes(id) { return window.hlx.plugins.includes(id); }
}

/**
 * Setup block utils.
 */
export function setup() {
  window.hlx = window.hlx || {};
  window.hlx.codeBasePath = '';
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
  window.hlx.patchBlockConfig = [];
  window.hlx.plugins = new PluginsRegistry();
  window.hlx.templates = new TemplatesRegistry();

  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
}

/**
 * Auto initializiation.
 */
function init() {
  document.body.style.display = 'none';
  setup();
  sampleRUM('top');

  window.addEventListener('load', () => sampleRUM('load'));

  window.addEventListener('unhandledrejection', (event) => {
    sampleRUM('error', { source: event.reason.sourceURL, target: event.reason.line });
  });

  window.addEventListener('error', (event) => {
    sampleRUM('error', { source: event.filename, target: event.lineno });
  });
}

init();
