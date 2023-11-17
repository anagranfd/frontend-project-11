import * as yup from 'yup';

export default (data1, links) => {
  const schema = yup.object().shape({
    link: yup
      .string()
      .url('wrongURL')
      .required('emptyInputState')
      .notOneOf(links, 'rssExists'),
  });

  return schema
    .validate(data1)
    .then(() => null)
    .catch((e) => e.message);
};
