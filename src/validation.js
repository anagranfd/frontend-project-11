import * as yup from 'yup';

export default (data1, links) => {
  const schema = yup.object().shape({
    link: yup.string().url().required().notOneOf(links, 'rssExists'),
  });

  return schema
    .validate(data1)
    .then(() => null)
    .catch((e) => {
      if (e.message === 'rssExists') {
        return 'rssExists';
      }
      return 'wrongURL';
    });
};
