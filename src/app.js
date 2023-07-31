import onChange from 'on-change';
import axios from 'axios';

import render from './render';
import validate, { previousUrls } from './validation';

export default () => {
  const urlContent = {};

  const elements = {
    container: document.querySelector('.container'),
    form: document.querySelector('form'),
    fields: {
      link: document.getElementById('floatingInput'),
    },
    submitButton: document.querySelector('button[type="submit"]'),
    feedbackElement: document.querySelector('.feedback'),
  };

  const initialState = {
    signupProcess: {
      processState: 'added',
      processError: null,
    },
    form: {
      valid: true,
      errors: {},
      fields: {
        link: '',
      },
      fieldsUi: {
        touched: {
          link: false,
        },
      },
      successFeedback: null,
    },
  };

  const state = onChange(initialState, render(elements, initialState));

  const refreshInputState = () => {
    Object.entries(elements.fields).forEach(([fieldName]) => {
      state.form.fields[fieldName] = '';
      state.form.fieldsUi.touched[fieldName] = false;
      state.form.valid = true;
      state.signupProcess.processState = 'added';
      state.signupProcess.processError = null;
    });
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const linkFieldValue = elements.fields.link.value;
    state.form.fields.link = linkFieldValue;
    validate(state.form.fields)
      .then((errors) => {
        // console.log(errors);
        state.form.errors = errors;
        return errors;
      })
      .catch((err) => {
        state.form.errors = err;
        return err;
      })
      .then((errors) => {
        if (Object.keys(errors).length > 0) {
          state.signupProcess.processState = 'error';
        } else {
          const nextLink = state.form.fields.link;
          // console.log(nextLink);
          if (nextLink === '') {
            state.form.successFeedback = null;
            // refreshInputState();
            return;
          }

          const nextIndex = Object.keys(previousUrls).length;
          state.signupProcess.processState = 'sending';
          previousUrls[nextIndex] = nextLink;

          axios
            .get(nextLink)
            .then((response) => {
              refreshInputState();
              urlContent[nextIndex] = response.data;
              state.form.successFeedback = {
                message: 'RSS успешно загружен',
              };
              elements.fields.link.focus();
              elements.fields.link.value = '';
            })
            .catch((err) => {
              if (err.response && err.response.status === 404) {
                state.signupProcess.processError = {
                  message:
                    'Адрес не найден. Пожалуйста, введите существующий URL.',
                };
              } else if (err.response) {
                state.signupProcess.processError = {
                  message: `Произошла ошибка. ${err.response.data.message}`,
                };
              } else if (err.request) {
                state.signupProcess.processError = {
                  message: 'Ошибка сети. Повторите запрос позже.',
                };
              } else {
                state.signupProcess.processError = {
                  message: 'Произошла ошибка. Повторите запрос позже.',
                };
              }
            });
        }
      });
  });

  elements.fields.link.focus();
};
