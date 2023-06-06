import addIframes from '../../scripts/delayed.js';

const soundcloud = {
  origin: 'https://w.soundcloud.com',
  url: 'https://api.soundcloud.com/tracks/',
};

const calculateIframeHeight = (text) => {
  // Extract the height value from the iframe HTML
  const heightRegex = /height="(\d+)"/;
  const heightMatch = text.match(heightRegex);
  if (heightMatch && heightMatch[1]) {
    return parseInt(heightMatch[1], 10);
  }
  return 0;
};

export default async function decorate(block) {
  const iframes = Array.from(block.querySelectorAll('.soundcloud > div'))
    .map((el) => ({
      element: el,
      iframe: el.children[1],
      text: el.children[1].textContent,
    }))
    .filter(({ text }) => /<iframe.*?<\/iframe>/.test(text));

  iframes.forEach(({ element, text }) => {
    const match = text.match(/src="(.*?)"/);
    if (match && match[1]) {
      const url = new URL(decodeURIComponent(match[1]));
      const urlParam = new URLSearchParams(url.search).get('url');
      if (url.origin === soundcloud.origin && urlParam?.startsWith(soundcloud.url)) {
        const height = calculateIframeHeight(text);
        element.children[1].style.height = `${height}px`;
        element.classList.add('soundcloud-col');
      }
    }
  });

  addIframes(iframes);
}
