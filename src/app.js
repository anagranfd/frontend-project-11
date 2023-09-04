/* eslint-disable import/no-extraneous-dependencies */
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import render from './render';
import validate from './validation';
import resources from './locales/index.js';
import parse from './parser';

const getRss = (url) => axios
  .get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
  .then((res) => res.data)
  .catch((e) => console.log(e));

const previousUrls = {};
const viewedLinks = {};

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
    },
  );

  container.innerHTML = '';
  container.append(rssTitleContainer);
};

const renderPosts = (content) => {
  const container = document.querySelector('.col.posts');
  const newPostsContainer = document.createElement('div');

  Object.values(content.data.posts).forEach(({ title, link, description }) => {
    const postContainer = document.createElement('div');
    postContainer.classList.add('row');

    const rssPostsContainer = document.createElement('div');
    rssPostsContainer.classList.add('col', 'posts');
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('col-md-auto');

    const rssPostElement = document.createElement('a');
    rssPostElement.textContent = title;
    rssPostElement.setAttribute('href', link);
    rssPostElement.setAttribute('style', 'display: block;');
    rssPostElement.classList.add('fw-bold');

    const btnElement = document.createElement('button');
    btnElement.setAttribute('type', 'button');
    btnElement.setAttribute('data-bs-toggle', 'modal');
    btnElement.setAttribute('data-bs-target', '#postModal');
    btnElement.setAttribute('data-href', link);
    btnElement.classList.add('btn', 'btn-outline-primary', 'add-post');
    btnElement.textContent = i18next.t('view');

    if (viewedLinks[link]) {
      rssPostElement.classList.toggle('fw-bold', false);
      rssPostElement.classList.add('text-muted', 'fw-normal');
    }

    btnElement.addEventListener('click', () => {
      const modalBody = document.querySelector('.modal-body');
      modalBody.innerHTML = '';
      const modalTitle = document.querySelector('.modal-title');
      modalTitle.textContent = title;
      const modalDescription = document.createElement('div');
      modalDescription.innerHTML = description;
      modalBody.append(modalDescription);

      const followLinkBtn = document.querySelector('.to-website');
      followLinkBtn.addEventListener('click', () => {
        window.location.href = link;
      });

      rssPostElement.classList.toggle('fw-bold', false);
      rssPostElement.classList.add('text-muted', 'fw-normal');
      viewedLinks[link] = true;
    });

    btnContainer.append(btnElement);
    rssPostsContainer.append(rssPostElement);

    postContainer.append(rssPostsContainer);
    postContainer.append(btnContainer);

    newPostsContainer.append(postContainer);
  });

  container.prepend(newPostsContainer);
};

const updatePosts = (content, links) => {
  console.log('CHECK!!!');
  links.forEach(({ id, link }) => {
    getRss(link)
      .then((response) => parse(response.contents))
      .then((data) => {
        const { posts } = content.data;
        const { infoItems } = data;

        const newPosts = infoItems.map(({ title, link, description }) => ({
          id,
          title,
          link,
          description,
        }));

        const updatedPosts = _.differenceBy(newPosts, posts, 'title');
        if (updatedPosts.length > 0) {
          content.data.posts = [...updatedPosts, ...posts];
        }
      })
      .then(() => {
        renderPosts(content);
      });
  });

  setTimeout(() => updatePosts(content, links), 5000);
};

export default () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources,
  });

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
    modalBody: document.querySelector('.modal-body'),
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

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const linkFieldValue = elements.fields.link.value;
    state.form.fields.link = linkFieldValue;
    validate(state.form.fields, previousUrls)
      .then((errors) => {
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

          const nextIndex = Object.keys(previousUrls).length;
          state.signupProcess.processState = 'sending';

          getRss(nextLink)
            .then((response) => {
              state.form.successFeedback = {
                message: i18next.t('submit.success'),
              };
              return parse(response.contents);
            })
            .then((content) => {
              const { feeds, posts, links } = urlContent.data;
              const { feedInfo, infoItems } = content;

              const id = nextIndex;
              urlContent.data.feeds = [{ id, ...feedInfo }, ...feeds];
              console.log(urlContent.data.feeds);
              const newPosts = infoItems.map(
                ({ title, link, description }) => ({
                  id: _.uniqueId(),
                  title,
                  link,
                  description,
                }),
              );
              urlContent.data.posts = [...newPosts, ...posts];
              urlContent.data.links = [{ id, link: nextLink }, ...links];
              console.log(urlContent.data.links);
              console.log(urlContent.data);

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

  updatePosts(urlContent, urlContent.data.links);
  elements.fields.link.focus();
};
