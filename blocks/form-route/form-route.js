/**
 * form-route block
 *
 * Authoring (Google Docs / SharePoint table):
 * - Optional single-cell rows at the top become intro content (heading + description).
 *   Headings, paragraphs, and any inline formatting are preserved.
 * - Subsequent rows have TWO columns:
 *     | Button label (may include a :icon-name: token) | Destination URL |
 *
 * Example:
 *   | form-route                                                            |
 *   | Existing Cepheid customer looking for information                     |
 *   | Select the option that best fits your query                           |
 *   | :clipboard: Sales, product, and pricing | /us/en/contact?topic=sales  |
 *   | :truck: Order and shipment              | /us/en/contact?topic=order  |
 *   | :chat: Technical Support                | /us/en/contact?topic=tech   |
 *   | :question: Something else               | /us/en/contact?topic=other  |
 */

function getUrlFromCell(cell) {
  const link = cell.querySelector('a[href]');
  if (link) return link.getAttribute('href');
  const text = cell.textContent.trim();
  return text || '#';
}

function extractIcon(labelCell) {
  // Prefer a Franklin :icon-name: token if present.
  const iconSpan = labelCell.querySelector('span.icon');
  if (iconSpan) {
    iconSpan.remove();
    return iconSpan;
  }
  // Otherwise treat any author-uploaded picture/img/svg as the icon.
  const picture = labelCell.querySelector('picture, img, svg');
  if (picture) {
    const node = picture.closest('picture') || picture;
    node.remove();
    return node;
  }
  return null;
}

function buildOption(labelCell, urlCell) {
  const li = document.createElement('li');
  li.className = 'form-route-option';

  const link = document.createElement('a');
  link.className = 'form-route-option-link';
  link.href = getUrlFromCell(urlCell);

  const iconNode = extractIcon(labelCell);
  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'form-route-option-icon';
  if (iconNode) iconWrapper.append(iconNode);

  // Drop any author-supplied URL inside the label cell so only the text remains.
  labelCell.querySelectorAll('a').forEach((a) => {
    a.replaceWith(document.createTextNode(a.textContent));
  });

  const label = document.createElement('span');
  label.className = 'form-route-option-label';
  label.innerHTML = labelCell.innerHTML.trim();

  link.append(iconWrapper, label);
  li.append(link);
  return li;
}

export default function decorate(block) {
  const rows = [...block.children];

  const intro = document.createElement('div');
  intro.className = 'form-route-intro';

  const list = document.createElement('ul');
  list.className = 'form-route-options';

  rows.forEach((row) => {
    const cells = [...row.children];

    if (cells.length <= 1) {
      const cell = cells[0];
      if (cell && cell.textContent.trim()) {
        [...cell.childNodes].forEach((node) => intro.append(node));
      }
      return;
    }

    const [labelCell, urlCell] = cells;
    if (!labelCell.textContent.trim()) return;
    list.append(buildOption(labelCell, urlCell));
  });

  block.textContent = '';
  if (intro.childNodes.length) block.append(intro);
  if (list.children.length) block.append(list);
}
