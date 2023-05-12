export default async function decorate(block) {
  const getNodeName = (index) => {
    const n = block.firstChild.firstChild.childNodes[index];
    return n.nodeName;
  };
  const isPictureAtPosition = (index) => {
    let ret = false;
    if (getNodeName(index) === 'PICTURE') ret = true;
    return ret;
  };
  const heroType = isPictureAtPosition(0) ? 'big' : 'light';
  block.classList.add(`hero-${heroType}`);

  if (heroType === 'light') {
    const picture = block.querySelector('picture');
    const newPictureParent = block.firstChild;
    const newPictureDiv = document.createElement('div');
    newPictureDiv.appendChild(picture);
    newPictureParent.appendChild(newPictureDiv);
  }
}
