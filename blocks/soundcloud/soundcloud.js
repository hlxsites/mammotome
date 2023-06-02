
export default async function decorate(block) {
  block.querySelectorAll('.soundcloud > div').forEach((el) => {
    el.classList.add('soundcloud-col');
    const iframeParent = el.children[1];
    const text = iframeParent.textContent;
    const regex = /<iframe.*?<\/iframe>/;
    const match = text.match(regex);
    if (match && match[0]) {
      const iframeTag = match[0];
      iframeParent.innerHTML = iframeTag;
    }
  });
}
