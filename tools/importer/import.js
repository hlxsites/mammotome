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

function createDomStructure(structure, parentElement, document) {
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
      createDomStructure(element.children, domElement, document);
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

function topLevel(section) {
  if (section.parentElement){
    if (section.parentElement.tagName.toLowerCase() !== 'section') {
    return topLevel(section.parentElement);
    } else {
      return false;
    }
  }
  return true;
}

export default {
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
      '#onetrust-consent-sdk'
    ]);

    // create the metadata block and append it to the main element
    // createMetadata(main, document);

    const sectionElements = main.querySelectorAll('.elementor-section');

    if (sectionElements?.length > 0) {
      let sections = Array.from(sectionElements.values());
      if (sections[0].classList.contains('elementor-section-full_width')) {
        if (sections[0].style['background-image']) {
          const img = document.createElement('img');
          const src = sections[0].style['background-image'].match(/url\((.*)\)/);
          if (src && src[1]) {
            img.src = src[1];
            sections[0].prepend(img);
          }
        }
        Array.from(sections[0].querySelectorAll('img')).filter((img) => img.src.match(/.*\/Hero-curve.svg/)).forEach((img) => {
          img.remove();
        });
        sections = sections.slice(1);
      }
      let middles = []
      let boxed = []
      sections.forEach((section) => {
        if (section.classList.contains('elementor-section-content-middle')) {
          middles.push(section);
        } else {
          if (middles.length > 0) {
            const parent = document.createElement('section');
            middles[0].replaceWith(parent);
            createDomStructure([{
                type: 'table',
                children: [
                  {
                    type: 'tr',
                    children: [{
                      type: 'th',
                      attributes: {colspan: 2},
                      textContent: 'Columns (image color light blue)'
                    }]
                  }
                ]
            }], parent, document);
            middles.forEach((m)=>{
              m.remove();
              const tr = document.createElement('tr');
              Array.from(m.querySelectorAll('.elementor-column').values()).forEach((c)=>{
              const th = document.createElement('th');
              th.append(c);
              tr.append(th);
              });
              parent.querySelector('table').append(tr);
            });
            middles = [];
          }
          if (!section.querySelector('section') && (section.querySelector('.elementor-widget-image-box'))) {
            boxed.push(section);
          } else if (!section.querySelector('section') && section.querySelector('article')){
            Array.from(section.querySelectorAll('article')).forEach((a) => boxed.push(a));
          } else {
            if (boxed.length > 0) {
              const parent = document.createElement('section');
              let parentSection = boxed[0];
              while (parentSection.tagName.toLowerCase() !== 'section' ||  !topLevel(parentSection)) {
                parentSection = parentSection.parentElement;
              }
              parentSection.parentElement.insertBefore(parent, parentSection.nextSibling);
              createDomStructure([{
                  type: 'table',
                  children: [
                    {
                      type: 'tr',
                      children: [{
                        type: 'th',
                        attributes: {colspan: 2},
                        textContent: 'Cards'
                      }]
                    }
                  ]
              }], parent, document);
              boxed.forEach((m)=>{
                m.remove();
                const tr = document.createElement('tr');
                if (m.tagName.toLowerCase() === 'article') {
                    const img = m.querySelector('.elementor-post__thumbnail img');
                    img.parentElement.parentElement.remove();
                    const th = document.createElement('th');
                    th.append(img);
                    tr.append(th);
                    const th2 = document.createElement('th');
                    th2.append(m);
                    tr.append(th2);
                } else {
                  const img = m.querySelector('.elementor-image-box-img  img');
                  img.parentElement.parentElement.remove();
                  const th = document.createElement('th');
                  th.append(img);
                  tr.append(th);
                  const th2 = document.createElement('th');
                  th2.append(m);
                  tr.append(th2);
                }
                parent.querySelector('table').append(tr);
              });
              boxed = []
              
            }
            if (section.style['background-image'] && section.style['background-image'].match(/url\(.*\/Mammotome-BG_Pattern-1.svg\)/)) {
                const meta = document.createElement('table');
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.setAttribute("colspan", "2");
                th.textContent = 'Section Metadata';
                tr.append(th);
                meta.append(tr);
                const tr2 = document.createElement('tr');
                const th21 = document.createElement('th');
                const th22 = document.createElement('th');
                th21.textContent = 'Style';
                tr2.append(th21);
  
                let text = 'Logo primary background, inverted text';
                if (Array.from(section.querySelectorAll('img')).some((img) => img.src.match(/.*\/Hero-curve-flipped.svg/))) {
                  text += ', arc top';
                }
  
                th22.textContent = text;
                tr2.append(th22);
                meta.append(tr2);
                section.append(meta);
                const br = document.createElement('div');
                br.textContent = '--';
                section.parentElement.insertBefore(br, section);
                const br2 = document.createElement('div');
                br2.textContent = '--';
                section.append(br2);
              
            }
          }
        }
        Array.from(section.querySelectorAll('img')).filter((img) => img.src.match(/.*\/Hero-curve-flipped.svg/)).forEach((img) => {
          img.remove();
        });
      });
      
    }
    console.log("test");
    const sectionsE = main.querySelectorAll('section');

    if (sectionsE?.length > 0) {
      let sections = Array.from(sectionsE.values());
      if (sections[0].classList.contains('elementor-section-full_width')) {
        sections = sections.slice(1);
      }
      sections.forEach((section) => {
        if (!section.querySelector('table') && section.querySelector('h2.elementor-heading-title')) {
          
            const meta = document.createElement('table');
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.setAttribute("colspan", "2");
            th.textContent = 'Section Metadata';
            tr.append(th);
            meta.append(tr);
            const tr2 = document.createElement('tr');
            const th21 = document.createElement('th');
            const th22 = document.createElement('th');
            th21.textContent = 'Style';
            tr2.append(th21);

            let text = 'Header-wide,header-uppercase, header-colored';
          
            th22.textContent = text;
            tr2.append(th22);
            meta.append(tr2);
            section.append(meta);
            const br = document.createElement('div');
            br.textContent = '--';
            section.parentElement.insertBefore(br, section);
            const br2 = document.createElement('div');
            br2.textContent = '--';
            section.append(br2);
          
        }
      });
    }
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
