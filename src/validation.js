import keyBy from 'lodash/keyBy.js';
import * as yup from 'yup';

export const previousUrls = {};

const schema = yup.object().shape({
  link: yup
    .string()
    .url('Ссылка должна быть валидным URL')
    .test(
      'is-unique',
      'RSS уже существует',
      (value) => !Object.values(previousUrls).includes(value),
    ),
});

export default (data1) => new Promise((resolve, reject) => {
  if (data1.link === '') {
    resolve({});
  } else {
    schema
      .validate(data1, { abortEarly: false })
      .then(() => resolve({}))
      .catch((e) => reject(keyBy(e.inner, 'path')));
  }
});

// export default (data1) => {
//   try {
//     schema.validateSync(data1, { abortEarly: false });
//     return {};
//   } catch (e) {
//     return keyBy(e.inner, 'path');
//   }
// };
