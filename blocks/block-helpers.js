/**
 * Creates an HTML element with the specified tag and attributes
 * @param {string} tag The HTML tag name
 * @param {object} attributes Object containing element attributes
 * @returns {HTMLElement} The created element
 */
export function createTag(tag, attributes = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

/**
 * Creates an SVG element with the specified icon name
 * @param {string} icon The name of the icon ('chevron', 'expand', 'close')
 * @returns {SVGElement} The created SVG element
 */
export function createSVG(icon) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  let path;
  switch (icon) {
    case 'chevron':
      path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      path.setAttribute('points', '9 18 15 12 9 6');
      break;
    case 'expand':
      // Expand/maximize icon
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3');
      break;
    case 'close':
      // Close/X icon
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '18');
      line1.setAttribute('y1', '6');
      line1.setAttribute('x2', '6');
      line1.setAttribute('y2', '18');
      svg.appendChild(line1);
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '6');
      line2.setAttribute('y1', '6');
      line2.setAttribute('x2', '18');
      line2.setAttribute('y2', '18');
      svg.appendChild(line2);
      return svg;
    default:
      break;
  }

  if (path) svg.appendChild(path);
  return svg;
}

