/* eslint-disable import/no-extraneous-dependencies */
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import render from './render';
import validate from './validation';
import resources from './locales/index.js';
import parse from './parser';

const renderFeeds = (content) => {
  const container = document.querySelector('.titles');
  const rssTitleContainer = document.createElement('div');

  Object.values(content.data.feeds).forEach(
    ({ feedTitle, feedDescription }) => {
      const rssTitleElement = document.createElement('h4');
      rssTitleElement.textContent = feedTitle;
      const rssDescElement = document.createElement('p');
      rssDescElement.textContent = feedDescription;
      rssTitleContainer.append(rssTitleElement, rssDescElement);
    }
  );

  container.innerHTML = '';
  container.append(rssTitleContainer);
};

const renderPosts = (content) => {
  const container = document.querySelector('.posts');
  const rssPostsContainer = document.createElement('div');

  Object.values(content.data.posts).forEach(({ title, link }) => {
    const rssPostElement = document.createElement('a');
    rssPostElement.textContent = title;
    rssPostElement.setAttribute('href', link);
    rssPostElement.setAttribute('style', 'display: block;');
    rssPostsContainer.append(rssPostElement);
  });

  container.innerHTML = '';
  container.append(rssPostsContainer);
};

export default () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources,
  });

  const getRss = (url) =>
    axios
      .get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
      .then((res) => res.data)
      .catch((e) => console.log(e));

  const previousUrls = {};

  const urlContent = {
    data: {
      feeds: [],
      posts: [],
      links: [],
    },
  };

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
      successFeedback: null,
    },
  };

  const state = onChange(initialState, render(elements, initialState));

  // const refreshInputState = () => {
  //   Object.entries(elements.fields).forEach(([fieldName]) => {
  //     state.form.fields[fieldName] = '';
  //     state.form.valid = true;
  //     state.signupProcess.processState = 'added';
  //     state.signupProcess.processError = null;
  //   });
  // };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const linkFieldValue = elements.fields.link.value;
    state.form.fields.link = linkFieldValue;
    validate(state.form.fields, previousUrls)
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
          // console.log(previousUrls);

          getRss(nextLink)
            .then((response) => {
              // const parser = new DOMParser();
              state.form.successFeedback = {
                message: i18next.t('submit.success'),
              };
              // console.log(parse(response));
              return parse(response.contents);
            })
            .then((content) => {
              const { feeds, posts, links } = urlContent.data;
              const { feedInfo, infoItems } = content;

              const id = nextIndex;
              urlContent.data.feeds = [{ id, ...feedInfo }, ...feeds];
              const newPosts = infoItems.map(
                ({ title, link, description }) => ({
                  id: _.uniqueId(),
                  title,
                  link,
                  description,
                })
              );
              urlContent.data.posts = [...newPosts, ...posts];
              urlContent.data.links = [{ id, link: nextLink }, ...links];
              // refreshInputState();
              // console.log(urlContent);
              // console.log(previousUrls);

              // renderFeeds(content);
              // renderPosts(urlContent);

              // renderRss(content);
              elements.fields.link.focus();
              elements.fields.link.value = '';
              previousUrls[nextIndex] = nextLink;
              state.signupProcess.processState = 'added';
              state.signupProcess.processError = null;
            })
            .then(() => renderFeeds(urlContent))
            .then(() => renderPosts(urlContent))
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
