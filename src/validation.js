/* eslint-disable import/no-extraneous-dependencies */
import keyBy from 'lodash/keyBy.js';
import * as yup from 'yup';
import i18next from 'i18next';

export default (data1, previousUrls) => {
  yup.setLocale({
    mixed: {
      test: i18next.t('submit.errors.rssExists'),
      required: i18next.t('submit.errors.wrongURL'),
    },
    string: {
      url: i18next.t('submit.errors.wrongURL'),
    },
  });

  const schema = yup.object().shape({
    link: yup
      .string()
      .url()
      .required()
      .test(
        'is-unique',
        i18next.t('submit.errors.rssExists'),
        (value) => !Object.values(previousUrls).includes(value)
      ),
  });

  return new Promise((resolve, reject) => {
    schema
      .validate(data1, { abortEarly: false })
      .then(() => resolve({}))
      .catch((e) => reject(keyBy(e.inner, 'path')));
  });
};
