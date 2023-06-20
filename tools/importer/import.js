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
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

const createSectionMetadata = (top, text, img, document) => {
  const table = [['Section Metadata']];
  if (text.length > 0) {
    const style = ['Style'];
    style.push(text);
    table.push(style);
  }
  if (img) {
    table.push(['background-image', img]);
  }
  if (table.length > 1) {
    top.append(WebImporter.DOMUtils.createTable(table, document));
  }
};

function getProductReference(section) {
  return Array.from(section.querySelectorAll('a')).filter((a) => a.href.match(/\/product-support\/(.+)/) || a.href.match(/\/documentazione-sui-prodotti\/(.+)/));
}

export default {
  REQUIRED_STYLES: ['display', 'background-image', 'background-color', 'color', 'font-size', 'font-weight', 'text-transform', 'letter-spacing', 'opacity'],
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      'header',
      'footer',
      '.elementor-location-header',
      '.elementor-location-footer',
      'noscript',
      'defs',
      'svg',
      '#onetrust-consent-sdk',
    ]);

    let topSections = Array.from(main.querySelectorAll('.elementor-top-section'));
    topSections.filter((top) => top.style.display === 'none').forEach((top) => top.remove());
    topSections = Array.from(main.querySelectorAll('.elementor-top-section'));
    let sectionCount = 0;
    topSections.forEach((top) => {
      console.log(top);
      // Massage hero
      if (sectionCount === 0) {
        if (top.classList.contains('elementor-section-full_width')) {
          const img = WebImporter.DOMUtils.getImgFromBackground(top, document);
          if (img) {
            top.prepend(img);
          }
          Array.from(top.querySelectorAll('img')).filter((i) => i.src.match(/.*\/Hero-curve.svg/)).forEach((i) => {
            i.remove();
          });
        }
        if (getProductReference(top).length > 0) {
          const as = getProductReference(top);
          let outer = as[0].parentElement;
          while (!Array.from(outer.classList).includes('elementor-row')) {
            outer = outer.parentElement;
          }
          const table = [];
          table[0] = ['Product Reference'];
          table[1] = [
            as.find((a) => a.href.match(/\/product-support\/(.+)/))?.href.match(/\/product-support\/([^/]*)(\/)?/)[1]
            || as.find((a) => a.href.match(/\/documentazione-sui-prodotti\/(.+)/))?.href.match(/\/documentazione-sui-prodotti\/([^/]*)(\/)?/)[1],
          ];
          outer.replaceWith(WebImporter.DOMUtils.createTable(table, document));
        }
      } else if (top.classList.contains('elementor-section-content-middle')) {
        let header = 'Columns';
        if (Array.from(top.querySelectorAll('.elementor-column-wrap').values()).some((wrap) => wrap.style.backgroundImage.match(/url\(.*\/Rectangle-BG-2.svg\)/))) {
          header += ' (image color light blue)';
        }
        const table = [[header]];
        table.push(Array.from(top.querySelectorAll('.elementor-inner-column').values()));
        if (table.length > 1) {
          top.innerHTML = '';
          top.append(WebImporter.DOMUtils.createTable(table, document));
        }
      } else if (top.classList.contains('elementor-section-boxed')) {
        let header = 'Columns';
        if (Array.from(top.querySelectorAll('.elementor-column-wrap').values()).some((wrap) => wrap.style.backgroundImage.match(/url\(.*\/Rectangle-BG-2.svg\)/))) {
          header += ' (image color light blue)';
        } else {
          header += '(centered, images small, text small)';
        }
        const table = [[header]];
        table.push(Array.from(top.querySelectorAll('.elementor-inner-column').values()));
        if (table.length > 1 && table[1].length > 0) {
          const div = document.createElement('div');
          table[1][0].replaceWith(div);
          table[1].forEach((column) => column.remove());
          div.replaceWith(WebImporter.DOMUtils.createTable(table, document));
        }
      }

      const boxed = Array.from(top.querySelectorAll('.elementor-widget-image-box').values());
      boxed.push(...Array.from(top.querySelectorAll('article').values()));

      if (boxed.length > 0) {
        const div = document.createElement('div');
        boxed[0].replaceWith(div);

        const table = [['Cards']];

        boxed.forEach((m) => {
          m.remove();
          const tr = [];
          if (m.tagName.toLowerCase() === 'article') {
            const img = m.querySelector('.elementor-post__thumbnail img');
            img.parentElement.parentElement.remove();
            tr.push(img);
            tr.push(m);
          } else {
            const img = m.querySelector('.elementor-image-box-img  img');
            img.parentElement.parentElement.remove();
            tr.push(img);
            tr.push(m);
          }
          table.push(tr);
        });
        div.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      }

      let sectionStyle = '';
      let sectionStyleDivider = '';
      let backgroundImage;

      if (top.style['background-image'] && top.style['background-image'].match(/url\(.*\/Mammotome-BG_Pattern-1.svg\)/)) {
        sectionStyle += sectionStyleDivider + 'Logo primary background';
        sectionStyleDivider = ', ';
      } else if (top.style['background-image'] && top.style['background-image'].match(/url\(.*\/Mammotome-BG_Pattern-2.svg\)/)) {
        sectionStyle += sectionStyleDivider + 'Logo secondary background';
        sectionStyleDivider = ', ';
      }
      if (Array.from(top.querySelectorAll('img')).some((img) => img.src.match(/.*\/Hero-curve-flipped.svg/))) {
        Array.from(top.querySelectorAll('img')).forEach((img) => img.remove());
        sectionStyle += sectionStyleDivider + 'arc top';
        sectionStyleDivider = ', ';
      }
      let skipBackground = false;
      if (top.querySelector('.elementor-background-overlay')) {
        const el = top.querySelector('.elementor-background-overlay');
        if (el.style.backgroundColor === 'rgb(72, 126, 217)') {
          sectionStyle += sectionStyleDivider + 'accent secondary blur overlay';
          sectionStyleDivider = ', ';
        } else if (el.style.backgroundColor === 'rgb(255, 255, 255)') {
          skipBackground = true;
        } else if (el.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
          sectionStyle += sectionStyleDivider + 'gradient secondary blur overlay';
          sectionStyleDivider = ', ';
        }
      }

      if (top.querySelector('.elementor-motion-effects-layer')) {
        const el = top.querySelector('.elementor-motion-effects-layer');
        if (!skipBackground) {
          const img = WebImporter.DOMUtils.replaceBackgroundByImg(el, document);
          if (img !== el) {
            backgroundImage = img;
          }
        }
        if (el.style.backgroundImage === 'rgb(72, 126, 217)') {
          sectionStyle += sectionStyleDivider + 'Base secondary blur overlay';
          sectionStyleDivider = ', ';
        }
      }

      if (top.style.backgroundColor === 'rgb(95, 141, 218)') {
        sectionStyle += sectionStyleDivider + 'Base secondary solid background';
        sectionStyleDivider = ', ';
      }

      if (top.querySelector('.elementor-heading-title')) {
        const el = top.querySelector('.elementor-heading-title');
        if (el.style.textTransform === 'uppercase') {
          sectionStyle += sectionStyleDivider + 'header-uppercase';
          sectionStyleDivider = ', ';
        }
        if (el.style.letterSpacing === '4px') {
          sectionStyle += sectionStyleDivider + 'text-wide';
          sectionStyleDivider = ', ';
        }
        if (el.style.fontSize === '28.799999px') {
          sectionStyle += sectionStyleDivider + 'text-large';
          sectionStyleDivider = ', ';
        }
        if (el.style.color === 'rgb(255, 255, 255)') {
          sectionStyle += sectionStyleDivider + 'inverted text';
          sectionStyleDivider = ', ';
        }
        if (el.style.color === 'rgb(132, 50, 155)') {
          sectionStyle += sectionStyleDivider + 'header-colored';
          sectionStyleDivider = ', ';
        }
      } else if (top.querySelector('p')) {
        if (top.querySelector('p').style.color === 'rgb(255, 255, 255)') {
          sectionStyle += sectionStyleDivider + 'inverted text';
          sectionStyleDivider = ', ';
        }
      }

      createSectionMetadata(top, sectionStyle, backgroundImage, document);

      top.parentElement.insertBefore(document.createElement('hr'), top.nextSibling);

      sectionCount += 1;
    });

    // create the metadata block and append it to the main element
    createMetadata(main, document);

    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
};
