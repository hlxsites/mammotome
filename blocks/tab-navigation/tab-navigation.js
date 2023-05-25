import { setActiveLink } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const links = block.querySelectorAll('a');
  setActiveLink(links, 'active');
}
