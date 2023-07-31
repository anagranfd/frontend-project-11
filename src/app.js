/* eslint-disable import/no-extraneous-dependencies */
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';

import render from './render';
import validate, { previousUrls } from './validation';
import resources from './locales/index.js';

export default () => {
  const count = {};

  i18next
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
      count.count = 0;
      count.lng = i18next.language;
    });

  // .then(() => {
  //   const i18nextInstance = i18next.createInstance();
  //   return i18nextInstance.init({
  //     lng: 'ru',
  //     debug: true,
  //     resources,
  //   });
  // })

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
                message: i18next.t('submit.success'),
              };
              elements.fields.link.focus();
              elements.fields.link.value = '';
            })
            .catch(() => {
              state.signupProcess.processError = {
                message: i18next.t('submit.errors.networkError'),
              };
            });
        }
      });
  });

  elements.fields.link.focus();
};
