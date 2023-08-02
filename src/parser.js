export default (data) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(data, 'text/xml');

  const checkParserError = () => {
    if (xml.querySelector('parsererror')) {
      throw new Error('parsererror');
    }
  };

  const getChannelInfo = () => {
    const channel = xml.querySelector('channel');
    const feedTitle = channel.querySelector('title').textContent;
    const feedDescription = channel.querySelector('description').textContent;
    const feedLink = channel.querySelector('link').textContent;
    return { feedTitle, feedDescription, feedLink };
  };

  const parseChannelItems = () => {
    const channelItems = xml.querySelectorAll('channel > item');
    const infoItems = Array.from(channelItems).map((item) => {
      const title = item.querySelector('title').textContent;
      const link = item.querySelector('link').textContent;
      const description = item.querySelector('description').textContent.trim();
      return { title, link, description };
    });
    return infoItems;
  };

  checkParserError();
  const feedInfo = getChannelInfo();
  const infoItems = parseChannelItems();

  return { feedInfo, infoItems };
};
