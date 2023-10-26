/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup';

export default (data1) => {
  const schema = yup.object().shape({
    link: yup.string().url().required(),
  });

  return schema
    .validate(data1)
    .then(() => null)
    .catch((e) => e.message);
};
