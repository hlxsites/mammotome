/**
 * Sometimes in columns containing only text,
 * the text is not wrapped by a paragraph.
 * This breaks the styling and makes it difficult to identify
 * text only columns. This methods fixes it by forcing wrapping
 * the text in a paragraph.
 * @param {HTMLElement} col
 */
function decorateOnlyTextColumn(col) {
  if (col.firstChild && col.firstChild.nodeType === Node.TEXT_NODE
     && !col.firstElementChild) {
    const paragraph = document.createElement('p');
    paragraph.appendChild(col.firstChild);
    col.appendChild(paragraph);
  }
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col, index) => {
      decorateOnlyTextColumn(col);
      const pic = col.querySelector('picture');
      const text = col.querySelector('p');

      // Adds Href to image if linked-images class was set
      if (pic && text && block.classList.contains('linked-images')) {
        const a = col.querySelector('a');
        if (a) {
          const href = a.getAttribute('href');
          const p = pic.parentElement;
          const newA = document.createElement('a');
          newA.setAttribute('href', href);
          newA.appendChild(pic);
          p.appendChild(newA);
        }
      }
      if (pic && !text) {
        const oddeven = (index % 2 === 0) ? 'even' : 'odd';
        const picWrapper = pic.closest('div');
        picWrapper.classList.add('columns-img-wrapper');
        picWrapper.classList.add(`columns-img-wrapper-${oddeven}`);
        const picDecoration = document.createElement('div');
        picDecoration.classList.add('columns-img-decoration');
        const picImg = document.createElement('div');
        picImg.classList.add('columns-img');
        picImg.appendChild(pic);
        picDecoration.appendChild(picImg);
        picWrapper.appendChild(picDecoration);
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      if (text && !pic) {
        const textWrapper = text.closest('div');
        textWrapper.classList.add('columns-txt-wrapper');
      }
    });
  });
}
