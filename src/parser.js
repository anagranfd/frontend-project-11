export default (data) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(data, 'text/xml');

  const parseError = dom.querySelector('parsererror');
  if (parseError) {
    throw new Error('parsererror');
  }

  const channel = dom.querySelector('channel');
  const feedTitle = channel.querySelector('title').textContent;
  const feedDescription = channel.querySelector('description').textContent;
  const feedLink = channel.querySelector('link').textContent;
  const feedInfo = { feedTitle, feedDescription, feedLink };

  const channelItems = dom.querySelectorAll('channel > item');
  const infoItems = Array.from(channelItems).map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent.trim();
    return { title, link, description };
  });

  return { feedInfo, infoItems };
};
