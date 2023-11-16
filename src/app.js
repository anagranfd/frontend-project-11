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

const getRss = (url) => axios.get(getProxyUrl(url)).then((res) => res.data);

const updatePosts = (state) => {
  const { feeds } = state.data;
  const timeout = 5000;

  const promises = feeds.map(({ url }) => getRss(url)
    .then((response) => {
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
    }));

  Promise.all(promises).then(() => {
    setTimeout(() => updatePosts(state), timeout);
  });
};

const addBtnModalPrevEventListener = (state) => {
  const postsContainer = document.querySelector('.mx-auto.posts');

  postsContainer.addEventListener('click', (e) => {
    const { target } = e;

    if (target.classList.contains('add-post')) {
      const hrefLink = target.dataset.href;
      const selectedPost = state.data.posts.find(
        ({ link }) => link === hrefLink,
      );
      state.viewedLinks[hrefLink] = true;
      state.selectedPost = selectedPost;
    }
  });
};

const handleError = (state, errorType) => {
  state.form.valid = false;
  state.form.errors = {
    message: i18next.t(`submit.errors.${errorType}`),
  };
  state.signupProcess.processState = 'error';
};

export default () => {
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
  i18next
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => {
      const initialState = {
        signupProcess: {
          processState: 'added',
        },
        form: {
          valid: null,
          errors: null,
        },
        data: {
          feeds: [],
          posts: [],
        },
        viewedLinks: {},
        selectedPost: null,
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

        const links = state.data.feeds.map((feed) => feed.url);
        validate({ link: url }, links).then((errorType) => {
          if (errorType) {
            state.form.errors = errorType;
            handleError(state, errorType);
            return;
          }
          state.signupProcess.processState = 'sending';

          getRss(url)
            .then((response) => {
              state.form.errors = null;
              state.form.valid = true;
              const content = parse(response.contents);
              const { feeds, posts } = state.data;
              const { feedInfo, infoItems } = content;
              const id = _.uniqueId();
              state.data.feeds = [{ id, url, ...feedInfo }, ...feeds];
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
