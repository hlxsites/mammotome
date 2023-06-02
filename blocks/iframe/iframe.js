export default async function decorate(block) {
  const text = block.textContent;

  const regex = /<iframe.*?<\/iframe>/;
  const match = text.match(regex);

  if (match) {
    const iframeTag = match[0];
    block.innerHTML = iframeTag;
  }
}
