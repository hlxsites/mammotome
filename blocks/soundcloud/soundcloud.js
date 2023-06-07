const SOUNDCLOUD = {
  origin: 'https://soundcloud.com',
  iframeOrigin: 'https://w.soundcloud.com',
  apiUrl: 'https://api.soundcloud.com/tracks/',
};

const FRANKLIN_DELAYED_COMPLETED_EVENT = 'franklin.delayed_completed';

const calculateIframeHeight = (text) => {
  // Extract the height value from the iframe HTML
  const heightRegex = /height="(\d+)"/;
  const heightMatch = text.match(heightRegex);
  return heightMatch && heightMatch[1] ? parseInt(heightMatch[1], 10) : 0;
};

const addSrcToIframes = async (iframe, url) => {
  iframe.src = url.toString();
};

const addEventListener = (iframe, url) => {
  document.addEventListener(
    FRANKLIN_DELAYED_COMPLETED_EVENT,
    addSrcToIframes(iframe, url),
  );
};

export default async function decorate(block) {
  const elements = Array.from(block.querySelectorAll('.soundcloud > div'));
  elements.reduce((podcasts, element) => {
    const textContent = element.children[1]?.textContent ?? '';
    const iframe = /<iframe.*?<\/iframe>/.exec(textContent)?.[0] ?? '';
    const div = /<div.*?<\/div>/.exec(textContent)?.[0] ?? '';

    const src = iframe.match(/src="(.*?)"/);
    if (src && src[1]) {
      const url = new URL(decodeURIComponent(src[1]));
      const urlParam = new URLSearchParams(url.search).get('url');
      if (url.origin === SOUNDCLOUD.iframeOrigin && urlParam?.startsWith(SOUNDCLOUD.apiUrl)) {
        podcasts.push({
          element, iframe, url, div,
        });
      }
    }
    return podcasts;
  }, []).forEach(({
    element, iframe, url, div,
  }) => {
    const height = calculateIframeHeight(iframe);
    const soundCloudFrame = document.createElement('iframe');
    soundCloudFrame.height = `${height}px`;
    soundCloudFrame.width = '100%';
    soundCloudFrame.setAttribute('loading', 'lazy');
    soundCloudFrame.setAttribute('scrolling', 'no');
    soundCloudFrame.setAttribute('frameborder', 'no');
    soundCloudFrame.setAttribute('allow', 'autoplay');
    // soundCloudFrame.src = url.toString();
    addEventListener(soundCloudFrame, url);
    element.children[1].innerHTML = '';
    element.children[1].appendChild(soundCloudFrame);
    element.classList.add('soundcloud-col');

    if (div.length > 0) {
      const divElement = document.createElement('div');
      divElement.innerHTML = div;

      const links = divElement.getElementsByTagName('a');
      const channel = links[0];
      const podcast = links[1];

      const titleDiv = document.createElement('div');
      titleDiv.classList.add('soundcloud-title');

      const channelElement = document.createElement('a');
      channelElement.href = new URL(channel.href).origin === SOUNDCLOUD.origin ? channel.href : '';
      channelElement.title = channel.title;
      channelElement.target = channel.target;
      channelElement.textContent = channel.textContent;

      const separator = document.createTextNode(' · ');

      const podcastElement = document.createElement('a');
      podcastElement.href = podcast.href;
      podcastElement.title = podcast.title;
      podcastElement.target = podcast.target;
      podcastElement.textContent = podcast.textContent;

      titleDiv.appendChild(channelElement);
      titleDiv.appendChild(separator);
      titleDiv.appendChild(podcastElement);

      element.children[1].appendChild(titleDiv);
    }
  });
}
