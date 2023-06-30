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

function createLink(href, text, prefix, document) {
  if (href) {
    const link = document.createElement('a');
    link.href = new URL(prefix).origin + href;
    link.innerHTML = text.innerHTML;
    return link;
  }
  return '';
}

export default {
  REQUIRED_STYLES: ['display', 'background-image', 'width', 'background-color', 'color', 'font-size', 'font-weight', 'text-transform', 'letter-spacing', 'opacity'],
  preprocess: ({
    // eslint-disable-next-line no-unused-vars
    document, _, html, params,
  }) => {
    const toggleElem = document.querySelector('.elementor-toggle');
    if (toggleElem) {
      let { style: { width } } = toggleElem;
      width = parseInt(width.substr(0, width.length - 2), 10);
      if (width < 700) {
        params.narrowCollapsible = true;
      }
    }
  },
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
      }

      const boxed = Array.from(top.querySelectorAll('.elementor-widget-image-box').values()).map((el) => (el.parentElement.classList.contains('elementor-widget-wrap') ? el.parentElement : el));
      // TODO move to separate file
      const box2 = top.querySelectorAll('.elementor-element article');
      const isCarousel = top.querySelector('.elementor-widget-media-carousel');
      const isCards = (boxed.length > 0) || box2.length > 0;
      const videoElem = top.querySelector('.elementor-widget-video .elementor-custom-embed-image-overlay');
      const soundCloudElem = top.querySelector('.elementor-shortcode');
      const collapsibleBlock = top.querySelector('.elementor-toggle');
      const prevNextBlock = top.querySelector('.elementor-post-navigation');
      const ifusBlock = top.querySelector('#ifu-index');
      if (ifusBlock) {
        ifusBlock.replaceWith(WebImporter.DOMUtils.createTable([['IFUS']], document));
      } else if (prevNextBlock) {
        const prevEl = prevNextBlock.querySelector('.elementor-post-navigation__prev a');
        const prevLink = prevEl?.href;
        const prevTitle = prevEl?.querySelector('.post-navigation__prev--title');
        const nextEl = prevNextBlock.querySelector('.elementor-post-navigation__next a');
        const nextLink = nextEl?.href;
        const nextTitle = nextEl?.querySelector('.post-navigation__next--title');
        const prevNextTable = [['Prev-next'], [createLink(prevLink, prevTitle, params.originalURL, document),
          createLink(nextLink, nextTitle, params.originalURL, document)]];
        top.querySelector('.elementor-row')?.replaceWith(WebImporter.DOMUtils.createTable(prevNextTable, document));
      } else if (collapsibleBlock) {
        const table = params.narrowCollapsible ? [['Collapsible (narrow)']] : [['Collapsible']];
        collapsibleBlock.querySelectorAll('.elementor-toggle-item').forEach((question) => {
          const rowElem = [question.querySelector('.elementor-toggle-title')?.innerHTML, question.querySelector('.elementor-tab-content').innerHTML];
          table.push(rowElem);
        });
        top.querySelector('.elementor-row')?.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      } else if (soundCloudElem && soundCloudElem.innerHTML) {
        const table = [['SoundCloud']];
        top.querySelectorAll('.elementor-widget-wrap').forEach((sound) => {
          if (sound.querySelector('.elementor-shortcode')) {
            let { innerHTML } = sound.querySelector('.elementor-shortcode');
            innerHTML = innerHTML.substring(0, innerHTML.indexOf('</iframe>') + '</iframe>'.length);
            const rowElem = [sound.querySelector('.elementor-image img'), innerHTML];
            if (!sound.closest('.elementor-inner-section')) {
              // construct stand alone sound cloud block
              const standAloneSound = [['SoundCloud'], rowElem];
              top.prepend(document.createElement('hr'));
              top.prepend(WebImporter.DOMUtils.createTable(standAloneSound, document));
            } else {
              // add to existing table
              table.push(rowElem);
            }
          }
        });
        if (table.length > 1) {
          top.querySelector('.elementor-row')?.replaceWith(WebImporter.DOMUtils.createTable(table, document));
        }
      } else if (videoElem) {
        const table = videoElem.closest('.elementor-column')?.classList?.contains('elementor-col-50')
          ? [['Video (two columns)']] : [['Video']];
        top.querySelectorAll('.elementor-widget-video .elementor-custom-embed-image-overlay').forEach((video) => {
          const videoThumb = video.querySelector('img');
          const videoUrl = JSON.parse(video.dataset.elementorLightbox).url;
          const rowElem = [video.closest('.elementor-column')?.querySelector('.elementor-text-editor'), videoUrl, videoThumb];
          table.push(rowElem);
        });
        top.querySelector('.elementor-row')?.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      } else if (isCarousel) {
        const table = [['Carousel']];
        const columns = top.querySelectorAll('.elementor-inner-section .elementor-row .elementor-column');
        const col1 = document.createElement('div');
        const imgUrls = [];
        columns[1]?.querySelectorAll('.swiper-slide').forEach((slide) => {
          if (slide.querySelector('a')) {
            // video
          } else {
            const img = slide.querySelector('.elementor-carousel-image');
            const imgUrlWrapper = img.style.backgroundImage;
            if (imgUrlWrapper) {
              const url1 = imgUrlWrapper.substring(4, imgUrlWrapper.length - 1);
              if (url1 && !imgUrls.includes(url1)) {
                imgUrls.push(url1);
                const imgElem = WebImporter.DOMUtils.replaceBackgroundByImg(img, document);
                col1.append(imgElem);
              }
            }
          }
        });
        const rowElem = [columns[0], col1];
        table.push(rowElem);
        top.querySelector('.elementor-inner-section')?.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      } else if (sectionCount > 0 && !isCards) {
        let header = 'Columns';
        if (Array.from(top.querySelectorAll('.elementor-column-wrap').values()).some((wrap) => wrap.style.backgroundImage.match(/url\(.*\/Rectangle-BG-2.svg\)/))) {
          header += ' (image color light blue)';
        }
        const table = [[header]];
        top.querySelectorAll('.elementor-inner-section .elementor-row').forEach((row) => {
          const rowElem = [];
          row.querySelectorAll('.elementor-column').forEach((col) => {
            if (!col.querySelector('.elementor-heading-title')) {
              rowElem.push(col);
            }
          });
          table.push(rowElem);
        });
        top.querySelector('.elementor-inner-section')?.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      }
      const parentContainer = box2[0]?.closest('.elementor-element');
      if (parentContainer) {
        const gridClass = Array.from(parentContainer.classList).find((cls) => cls.startsWith('elementor-grid-'));
        const numColumns = gridClass ? parseInt(gridClass.substring('elementor-grid-'.length), 10) : 2;
        let cardHeader = ['Cards'];
        switch (numColumns) {
          case 3:
            cardHeader = ['Cards (three-columns)'];
            break;
          case 4:
            cardHeader = ['Cards (four-columns)'];
            break;
          default:
            cardHeader = ['Cards (two-columns)'];
        }
        const table = [cardHeader];
        box2.forEach((m) => {
          m.remove();
          const tr = [];
          if (m.tagName.toLowerCase() === 'article') {
            const img = m.querySelector('.elementor-post__thumbnail img');
            img?.parentElement?.parentElement.remove();
            tr.push(img);
            tr.push(m);
          }
          table.push(tr);
        });
        parentContainer.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      }

      const table = [['Cards']];
      if (boxed.length > 0) {
        const div = document.createElement('div');
        boxed[0].replaceWith(div);
        boxed.forEach((m) => {
          m.remove();
          const tr = [];
          const img = m.querySelector('.elementor-image-box-img  img');
          img?.parentElement?.parentElement.remove();
          tr.push(img);
          tr.push(m);
          table.push(tr);
        });
        div.replaceWith(WebImporter.DOMUtils.createTable(table, document));
      }

      let sectionStyle = '';
      let sectionStyleDivider = '';
      let backgroundImage;

      if (top.style['background-image'] && top.style['background-image'].match(/url\(.*\/Mammotome-BG_Pattern-1.svg\)/)) {
        sectionStyle += `${sectionStyleDivider}Logo primary background`;
        sectionStyleDivider = ', ';
      } else if (top.style['background-image'] && top.style['background-image'].match(/url\(.*\/Mammotome-BG_Pattern-2.svg\)/)) {
        sectionStyle += `${sectionStyleDivider}Logo secondary background`;
        sectionStyleDivider = ', ';
      }
      if (Array.from(top.querySelectorAll('img')).some((img) => img.src.match(/.*\/Hero-curve-flipped.svg/))) {
        Array.from(top.querySelectorAll('img')).forEach((img) => img.remove());
        sectionStyle += `${sectionStyleDivider}arc top`;
        sectionStyleDivider = ', ';
      }
      let skipBackground = false;
      if (top.querySelector('.elementor-background-overlay')) {
        const el = top.querySelector('.elementor-background-overlay');
        if (el.style.backgroundColor === 'rgb(72, 126, 217)') {
          sectionStyle += `${sectionStyleDivider}accent secondary blur overlay`;
          sectionStyleDivider = ', ';
        } else if (el.style.backgroundColor === 'rgb(255, 255, 255)') {
          skipBackground = true;
        } else if (el.style.backgroundColor === 'rgba(0, 0, 0, 0)') {
          sectionStyle += `${sectionStyleDivider}gradient secondary blur overlay`;
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
          sectionStyle += `${sectionStyleDivider}Base secondary blur overlay`;
          sectionStyleDivider = ', ';
        }
      }

      if (top.style.backgroundColor === 'rgb(95, 141, 218)') {
        sectionStyle += `${sectionStyleDivider}accent primary solid background`;
        sectionStyleDivider = ', ';
      }

      if (top.querySelector('.elementor-heading-title')) {
        const el = top.querySelector('.elementor-heading-title');
        if (el.style.textTransform === 'uppercase') {
          sectionStyle += `${sectionStyleDivider}header-uppercase`;
          sectionStyleDivider = ', ';
        }
        if (el.style.letterSpacing === '4px') {
          sectionStyle += `${sectionStyleDivider}text-wide`;
          sectionStyleDivider = ', ';
        }
        if (el.style.fontSize === '28.799999px') {
          sectionStyle += `${sectionStyleDivider}text-large`;
          sectionStyleDivider = ', ';
        }
        if (el.style.color === 'rgb(255, 255, 255)') {
          sectionStyle += `${sectionStyleDivider}inverted text`;
          sectionStyleDivider = ', ';
        }
        if (el.style.color === 'rgb(132, 50, 155)') {
          sectionStyle += `${sectionStyleDivider}header-colored`;
          sectionStyleDivider = ', ';
        }
      } else if (top.querySelector('p')) {
        if (top.querySelector('p').style.color === 'rgb(255, 255, 255)') {
          sectionStyle += `${sectionStyleDivider}inverted text`;
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
