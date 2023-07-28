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
          const imageLinkLabel = a.getAttribute('aria-label');
          newA.setAttribute('href', href);
          newA.setAttribute('aria-label', imageLinkLabel);
          newA.appendChild(pic);
          p.appendChild(newA);
        }
      }

      if (pic && !text) {
        const oddeven = (index % 2 === 0) ? 'even' : 'odd';
        const picWrapper = pic.closest('div');
        const picDecoration = document.createElement('div');
        const picImg = document.createElement('div');
        const frag = document.createDocumentFragment();

        picWrapper.classList.add('columns-img-wrapper', `columns-img-wrapper-${oddeven}`);

        picDecoration.classList.add('columns-img-decoration');
        picImg.classList.add('columns-img');
        picImg.appendChild(pic);
        picDecoration.appendChild(picImg);

        frag.appendChild(picDecoration);
        picWrapper.appendChild(frag);

        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }

      if (text && !pic) {
        const textWrapper = text.closest('div');
        textWrapper.classList.add('columns-txt-wrapper');
      }

      // not using :has selector because it's not supported in FF (fixes https://github.com/hlxsites/mammotome/issues/499)
      const paragraphs = Array.from(col.querySelectorAll('main .columns.image-cards p'));
      const imageCards = paragraphs.filter((p) => p.querySelector('picture'));

      imageCards.forEach((imageCard) => {
        const imageCardLink = imageCard.querySelector('a');
        if (imageCardLink) {
          const image = imageCard.querySelector('picture');
          imageCardLink.appendChild(image);
        }
      });
    });
  });
}
