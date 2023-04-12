export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picDecorationWrapper = pic.closest('div');
        picDecorationWrapper.classList.add('columns-img-wrapper');
        picDecorationWrapper.classList.add('columns-img-decoration');
        const picWrapper = document.createElement('div');
        picWrapper.appendChild(pic);
        picDecorationWrapper.appendChild(picWrapper);
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      const text = col.querySelector('p');
      if (text) {
        const textWrapper = text.closest('div');
        textWrapper.classList.add('columns-txt-wrapper');
      }
    });
  });
}
