/* eslint-disable import/no-extraneous-dependencies */
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import render from './render';
import validate from './validation';
import resources from './locales/index.js';
import parse from './parser';

const getProxyUrl = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getRss = (url) => axios
  .get(getProxyUrl(url))
  .then((res) => res.data)
  .catch((e) => Promise.reject(e));

const updatePosts = (state) => {
  const { feeds } = state.data;

  const promises = feeds.map(({ url }) => {
    const timeoutPromise = new Promise((__, reject) => setTimeout(() => reject(new Error('Timeout occurred')), 5000));
    Promise.race([getRss(url), timeoutPromise])
      .then((response) => {
        if (response.contents.startsWith('<!DOCTYPE html>')) {
          return Promise.reject(
            new Error('Received HTML instead of XML. Possibly an error page.'),
          );
        }
        const content = parse(response.contents);
        const { posts } = state.data;
        const { infoItems } = content;

        const newPosts = infoItems.map(({ title, link, description }) => ({
          id: _.uniqueId(),
          title,
          link,
          description,
        }));

        const uniqueNewPosts = _.differenceBy(newPosts, posts, 'link');

        if (uniqueNewPosts.length > 0) {
          state.data.posts = [...uniqueNewPosts, ...posts];
        }
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('An error occurred:', error);
        if (error.message === 'Timeout occurred') {
          return Promise.resolve();
        }
        return Promise.resolve();
      });
  });

  Promise.all(promises).then(() => {
    setTimeout(() => updatePosts(state), 5000);
  });
};

const addBtnModalPrevEventListener = (state) => {
  const postsContainer = document.querySelector('.mx-auto.posts');

  const modalTitle = document.querySelector('.modal-title');
  const modalDescription = document.querySelector('.modal-body');
  modalDescription.innerHTML = '';

  postsContainer.addEventListener('click', (e) => {
    const { target } = e;

    if (target.classList.contains('add-post')) {
      const hrefLink = target.dataset.href;
      const { title, description } = Object.values(state.data.posts).find(
        ({ link }) => link === hrefLink,
      );

      const rssPostElement = document.querySelector(`a[href="${hrefLink}"]`);

      modalTitle.textContent = title;
      modalDescription.innerHTML = `<div>${description}</div>`;

      const followLinkBtn = document.querySelector('.to-website');

      const followLinkHandler = () => {
        window.location.href = hrefLink;
      };
      followLinkBtn.removeEventListener('click', followLinkHandler);
      followLinkBtn.addEventListener('click', followLinkHandler);

      state.viewedLinks[hrefLink] = true;
      rssPostElement.classList.toggle('fw-bold', false);
      rssPostElement.classList.add('text-muted', 'fw-normal');
    }
  });
};

const handleError = (state, errorType) => {
  state.form.errors = {
    message: i18next.t(`submit.errors.${errorType}`),
  };
  state.signupProcess.processState = 'error';
};

export default () => {
  i18next
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
      yup.setLocale({
        mixed: {
          required: () => i18next.t('submit.errors.emptyInputState'),
          url: () => i18next.t('submit.errors.wrongURL'),
        },
        string: {
          url: () => i18next.t('submit.errors.wrongURL'),
          notOneOf: () => i18next.t('submit.errors.rssExists'),
        },
      });
    })
    .then(() => {
      const initialState = {
        signupProcess: {
          processState: 'added',
        },
        form: {
          valid: true,
          errors: null,
          fields: {
            link: '',
          },
          successFeedback: null,
        },
        data: {
          feeds: [],
          posts: [],
        },
        viewedLinks: {},
      };

      const elements = {
        container: document.querySelector('.container'),
        form: document.querySelector('form'),
        fields: {
          link: document.querySelector('input[aria-label="url"]'),
        },
        submitButton: document.querySelector('button[type="submit"]'),
        feedbackElement: document.querySelector('.feedback'),
        modalBody: document.querySelector('.modal-body'),
      };

      const state = onChange(initialState, render(elements, initialState));
      addBtnModalPrevEventListener(state);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        state.form.fields.link = url;

        const alreadyExists = state.data.feeds.some((feed) => feed.url === url);
        if (alreadyExists) {
          handleError(state, 'rssExists');
          return;
        }

        validate(state.form.fields).then((error) => {
          console.log(error);
          if (error) {
            state.form.errors = error;
            handleError(state, 'wrongURL');
            return;
          }
          state.signupProcess.processState = 'sending';
          const nextLink = state.form.fields.link;

          const timeoutPromise = new Promise((__, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));

          Promise.race([getRss(nextLink), timeoutPromise])
            .then((response) => {
              state.form.errors = null;
              state.form.successFeedback = {
                message: i18next.t('submit.success'),
              };
              const content = parse(response.contents);
              return content;
            })
            .then((content) => {
              const { feeds, posts } = state.data;
              const { feedInfo, infoItems } = content;
              const id = _.uniqueId();
              state.data.feeds = [{ id, url: nextLink, ...feedInfo }, ...feeds];
              const newPosts = infoItems.map(
                ({ title, link, description }) => ({
                  id: _.uniqueId(),
                  title,
                  link,
                  description,
                }),
              );
              state.data.posts = [...newPosts, ...posts];
              state.signupProcess.processState = 'added';
            })
            .catch((err) => {
              console.log(err.message);
              if (err.message === 'parsererror') {
                handleError(state, 'rssMissing');
              } else {
                handleError(state, 'networkError');
              }
            });
        });
      });
      updatePosts(state);
    });
};
