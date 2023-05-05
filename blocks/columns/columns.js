export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col, index) => {
      const pic = col.querySelector('picture');
      const text = col.querySelector('p');

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
