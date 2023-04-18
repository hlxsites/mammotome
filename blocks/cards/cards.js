import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    let cardLink;
    
    const cardSections = [...row.children];  
    for (const i in cardSections) {
      const div = cardSections[i];  
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else if (div.children.length === 0) {
        div.className = 'cards-card-body empty';
      }else {
        div.className = 'cards-card-body';
        const action = div.querySelector('p > a');
        if (action) {
          const actionBlock = action.parentElement;
          actionBlock.className="";
          actionBlock.classList.add("callout");
          actionBlock.innerHTML = action.innerHTML;

          cardLink = document.createElement('a');
          cardLink.href = action.href;
          cardLink.innerHTML = row.innerHTML;
        }
      }  
    }  
    if (cardLink) {
      li.appendChild(cardLink);
    } else {
      li.innerHTML = row.innerHTML;
    }
    ul.append(li);
  });
  ul
    .querySelectorAll('img')
    .forEach((img) => {
      img
        .closest('picture')
        .replaceWith(
          createOptimizedPicture(
            img.src,
            img.alt,
            false,
            null,
            null,
            [{ width: '600' }],
          ),
        );
    });
  block.textContent = '';
  block.append(ul);
}
