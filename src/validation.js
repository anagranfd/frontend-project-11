/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup';
import i18next from 'i18next';

yup.setLocale({
  mixed: {
    required: () => i18next.t('submit.errors.emptyInputState'),
    url: () => i18next.t('submit.errors.wrongURL'),
  },
  string: {
    url: () => i18next.t('submit.errors.wrongURL'),
  },
});

export default (data1, previousUrls) => {
  const schema = yup.object().shape({
    link: yup
      .string()
      .url()
      .required()
      .notOneOf(Object.values(previousUrls), () => i18next.t('submit.errors.rssExists')),
  });

  // return new Promise((resolve, reject) => {
  //   schema
  //     .validate(data1, { abortEarly: false })
  //     .then(() => resolve({}))
  //     .catch((e) => reject(keyBy(e.inner, 'path')));
  // });

  return schema
    .validate(data1)
    .then(() => null)
    .catch((e) => e.message);
};
