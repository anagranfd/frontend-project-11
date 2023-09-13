/* eslint-disable import/no-extraneous-dependencies */
import onChange from 'on-change';
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

// const updatePosts = (state) => {
//   const { links } = state.data;
//   const promises = links.map(({ id, link }) =>
//     getRss(link)
//       .then((response) => parse(response.contents))
//       .then((data) => {
//         const { posts } = state.data;
//         const { infoItems } = data;
//         const newPosts = infoItems.map(({ title, link, description }) => ({
//           id,
//           title,
//           link,
//           description,
//         }));
//         const updatedPosts = _.differenceBy(newPosts, posts, 'title');
//         if (updatedPosts.length > 0) {
//           state.data.posts = [...updatedPosts, ...posts];
//         }
//       })
//   );

//   Promise.all(promises).finally(() => {
//     setTimeout(() => updatePosts(state), 5000);
//   });
// };

const updatePosts = (state) => {
  const { links } = state.data;

  const promises = links.map(({ link }) => {
    const timeoutPromise = new Promise((__, reject) => setTimeout(() => reject(new Error('Timeout occurred')), 5000));
    Promise.race([getRss(link), timeoutPromise])
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
          state.data.newPosts = uniqueNewPosts;
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

  postsContainer.addEventListener('click', (e) => {
    const { target } = e;

    if (target.classList.contains('add-post')) {
      const hrefLink = target.dataset.href;
      const { title, description } = Object.values(state.data.posts).find(
        ({ link }) => link === hrefLink,
      );

      const rssPostElement = document.querySelector(`a[href="${hrefLink}"]`);

      const modalBody = document.querySelector('.modal-body');
      console.log(modalBody);
      modalBody.innerHTML = '';
      const modalTitle = document.querySelector('.modal-title');
      modalTitle.textContent = title;
      const modalDescription = document.createElement('div');
      modalDescription.innerHTML = description;
      modalBody.append(modalDescription);

      const followLinkBtn = document.querySelector('.to-website');
      followLinkBtn.addEventListener('click', () => {
        window.location.href = hrefLink;
      });

      state.viewedLinks[hrefLink] = true;
      console.log(rssPostElement);
      rssPostElement.classList.toggle('fw-bold', false);
      rssPostElement.classList.add('text-muted', 'fw-normal');
    }
  });
};

const handleError = (state, errorType) => {
  state.signupProcess.processError = {
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
      const initialState = {
        signupProcess: {
          processState: 'added',
          processError: null,
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
          newPosts: [],
          links: [],
        },
        previousUrls: {},
        viewedLinks: {},
      };

      return initialState;
    })
    .then((initialState) => {
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
        const linkFieldValue = elements.fields.link.value;
        state.form.fields.link = linkFieldValue;

        validate(state.form.fields, state.previousUrls).then((error) => {
          console.log(error);
          if (error) {
            state.form.errors = error;
            if (error === i18next.t('submit.errors.rssExists')) {
              handleError(state, 'rssExists');
            } else {
              handleError(state, 'wrongURL');
            }
            return;
          }
          // state.form.errors = null;
          state.signupProcess.processState = 'sending';
          const nextLink = state.form.fields.link;

          const timeoutPromise = new Promise((__, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));

          Promise.race([getRss(nextLink), timeoutPromise])
            .then((response) => {
              state.signupProcess.processError = null;
              state.form.successFeedback = {
                message: i18next.t('submit.success'),
              };
              const content = parse(response.contents);
              return content;
            })
            .then((content) => {
              const { feeds, posts, links } = state.data;
              const { feedInfo, infoItems } = content;
              const id = _.uniqueId();
              state.data.feeds = [{ id, ...feedInfo }, ...feeds];
              const newPosts = infoItems.map(
                ({ title, link, description }) => ({
                  id: _.uniqueId(),
                  title,
                  link,
                  description,
                }),
              );
              state.data.newPosts = newPosts;
              state.data.posts = [...newPosts, ...posts];
              state.data.links = [{ id, link: nextLink }, ...links];
              state.previousUrls[id] = nextLink;
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
