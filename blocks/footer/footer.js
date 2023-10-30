import { decorateIcons, decorateSupScriptInTextBelow, getMetadata } from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerPath = getMetadata('footer') || '/footer';

  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    // Duplicate .icon-logo element
    const logoElement = footer.querySelector('.icon-logo');

    if (logoElement) {
      const logoParagraph = logoElement.parentElement.parentElement;
      if (logoParagraph) {
        const clonedParagraph = logoParagraph.cloneNode(true);
        const newDiv = document.createElement('div');
        newDiv.appendChild(clonedParagraph);
        footer.insertBefore(newDiv, footer.firstElementChild);
      }
    }

    // Duplicate .icon-danahertrustmark element
    const trustmarkElement = footer.querySelector('.icon-danahertrustmark');
    if (trustmarkElement) {
      const trustmarkParagraph = trustmarkElement.parentElement;
      if (trustmarkParagraph) {
        const clonedParagraph = trustmarkParagraph.cloneNode(true);
        const newDiv = document.createElement('div');
        newDiv.appendChild(clonedParagraph);
        footer.querySelector('.columns').firstElementChild.appendChild(newDiv);
      }
    }

    // decorate cookie settings (us/en/ & /uk/en/ only)
    const cookieSettingsAnchor = footer.querySelector('#legal')?.nextElementSibling?.lastElementChild?.querySelector('a');
    if (cookieSettingsAnchor) {
      cookieSettingsAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        if (window.OneTrust) window.OneTrust.ToggleInfoDisplay();
      });
    }

    await decorateIcons(footer);
    decorateSupScriptInTextBelow(footer);
    block.append(footer);
  }
}
