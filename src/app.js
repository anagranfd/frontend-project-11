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

const timeout = 5000;

const handleError = (error) => {
  if (typeof error === 'string') {
    return i18next.t(`submit.errors.${error}`);
  }
  if (
    error.code === 'ECONNABORTED'
    || error.code === 'ERR_NETWORK'
    || error.response
  ) {
    return i18next.t('submit.errors.networkError');
  }
  return i18next.t('submit.errors.rssMissing');
};

const getRss = (url) => axios.get(getProxyUrl(url), { timeout }).then((res) => res.data);

const updatePosts = (state) => {
  const { feeds } = state.data;

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
    })
    .catch((error) => {
      console.error('An error occurred:', error);
    }));

  Promise.all(promises).finally(() => {
    setTimeout(() => updatePosts(state), timeout);
  });
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
        loadingProcess: 'success',
        form: {
          valid: true,
          errors: null,
        },
        data: {
          feeds: [],
          posts: [],
        },
        viewedLinks: [],
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
        modalTitle: document.querySelector('.modal-title'),
        followLinkBtn: document.querySelector('.to-website'),
        postsContainer: document.querySelector('.mx-auto.posts'),
      };

      const state = onChange(initialState, render(elements, initialState));
      elements.postsContainer.addEventListener('click', (e) => {
        const { target } = e;
        const hrefLink = target.tagName === 'A'
          ? target.getAttribute('href')
          : target.dataset.href;

        const selectedPost = state.data.posts.find(
          ({ link }) => link === hrefLink,
        );

        if (selectedPost) {
          const { id } = selectedPost;

          if (!state.viewedLinks.includes(id)) {
            state.viewedLinks.push(id);
          }

          state.selectedPost = selectedPost;
        }
      });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');

        const links = state.data.feeds.map((feed) => feed.url);
        validate({ link: url }, links).then((error) => {
          if (error) {
            state.form = {
              valid: false,
              errors: handleError(error),
            };
            state.loadingProcess = 'error';
            return;
          }
          state.loadingProcess = 'sending';

          getRss(url)
            .then((response) => {
              state.form = {
                valid: true,
                errors: null,
              };
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
              state.loadingProcess = 'success';
            })
            .catch((err) => {
              state.form = {
                valid: false,
                errors: handleError(err),
              };
              state.loadingProcess = 'error';
            });
        });
      });
      updatePosts(state);
    });
};
