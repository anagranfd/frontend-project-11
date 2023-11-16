import i18next from 'i18next';

const handleProcessState = (elements, processState) => {
  switch (processState) {
    case 'added':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
      elements.fields.link.value = '';
      elements.fields.link.focus();
      break;

    case 'error':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
      break;

    case 'sending':
      elements.submitButton.disabled = true;
      elements.fields.link.disabled = true;
      break;

    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderProcessError = (elements, error, prevError) => {
  const fieldElement = elements.fields.link;
  const { feedbackElement } = elements;
  const fieldHadError = prevError !== null;
  const fieldHasError = error !== null;

  if (!fieldHadError && !fieldHasError) {
    return;
  }

  if (fieldHadError && !fieldHasError) {
    fieldElement.classList.remove('is-invalid', 'is-valid');
    feedbackElement.textContent = '';
    return;
  }

  if (fieldHasError) {
    fieldElement.classList.toggle('is-invalid', true);
    feedbackElement.classList.toggle('text-success', false);
    feedbackElement.classList.toggle('text-danger', true);
    feedbackElement.textContent = error.message;
  }
};

const renderSuccessFeedback = (elements, value, prevValue) => {
  const fieldElement = elements.fields.link;
  const { feedbackElement } = elements;
  const fieldHadSuccess = prevValue;
  const fieldHasSuccess = value;

  if (!fieldHadSuccess && !fieldHasSuccess) {
    return;
  }

  if (fieldHadSuccess && !fieldHasSuccess) {
    fieldElement.classList.remove('is-invalid', 'is-valid');
    feedbackElement.textContent = '';
    return;
  }

  if (fieldHasSuccess) {
    fieldElement.classList.toggle('is-valid', true);
    feedbackElement.classList.toggle('text-danger', false);
    feedbackElement.classList.toggle('text-success', true);
    feedbackElement.textContent = {
      message: i18next.t('submit.success'),
    }.message;
  }
};

const renderSelectedPost = (elements, value) => {
  const { modalBody } = elements;
  const modalTitle = document.querySelector('.modal-title');
  modalBody.innerHTML = '';

  const { title, description, link } = value;

  modalTitle.textContent = title;
  modalBody.innerHTML = `<div>${description}</div>`;

  const followLinkBtn = document.querySelector('.to-website');

  const followLinkHandler = () => {
    window.location.href = link;
  };

  followLinkBtn.removeEventListener('click', followLinkHandler);
  followLinkBtn.addEventListener('click', followLinkHandler);
};

const renderFeeds = (content) => {
  const container = document.querySelector('.feeds');
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

  container.textContent = '';
  container.append(rssTitleContainer);
};

const renderPosts = (content) => {
  const container = document.querySelector('.mx-auto.posts');
  container.textContent = '';
  Object.values(content.data.posts).forEach(({ title, link }) => {
    const postContainer = document.createElement('div');
    postContainer.classList.add('row', 'mb-3');

    const rssPostsContainer = document.createElement('div');
    rssPostsContainer.classList.add('col', 'posts');
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('col-md-auto');

    const rssPostElement = document.createElement('a');
    rssPostElement.textContent = title;
    rssPostElement.setAttribute('href', link);
    rssPostElement.setAttribute('style', 'display: block;');

    if (content.viewedLinks[link]) {
      rssPostElement.classList.add('text-muted', 'fw-normal');
    } else {
      rssPostElement.classList.add('fw-bold');
    }

    const btnElement = document.createElement('button');
    btnElement.setAttribute('type', 'button');
    btnElement.setAttribute('data-bs-toggle', 'modal');
    btnElement.setAttribute('data-bs-target', '#modal');
    btnElement.setAttribute('data-href', link);
    btnElement.classList.add(
      'btn',
      'btn-outline-primary',
      'btn-sm',
      'add-post',
    );
    btnElement.textContent = i18next.t('view');

    btnContainer.append(btnElement);
    rssPostsContainer.append(rssPostElement);

    postContainer.append(rssPostsContainer);
    postContainer.append(btnContainer);

    container.appendChild(postContainer);
  });
};

export default (elements, initialState) => (path, value, prevValue) => {
  switch (path) {
    case 'signupProcess.processState':
      handleProcessState(elements, value);
      break;

    case 'form.successFeedback':
      renderSuccessFeedback(elements, value);
      break;

    case 'form.errors':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
      renderProcessError(elements, value, prevValue, initialState);
      break;

    case 'form.valid':
      elements.submitButton.disabled = !value;
      renderSuccessFeedback(elements, value);
      break;

    case 'data.feeds':
      renderFeeds(initialState);
      break;

    case 'data.posts':
      renderPosts(initialState);
      break;

    case 'selectedPost':
      renderPosts(initialState);
      renderSelectedPost(elements, value);
      break;

    default:
      break;
  }
};
