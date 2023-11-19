import i18next from 'i18next';

const handleProcessState = (elements, loadingProcess) => {
  switch (loadingProcess) {
    case 'success':
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
      throw new Error(`Unknown process state: ${loadingProcess}`);
  }
};

const renderProcessError = (elements, error) => {
  const fieldElement = elements.fields.link;
  const { feedbackElement } = elements;

  if (!error) {
    fieldElement.classList.remove('is-invalid');
    fieldElement.classList.add('is-valid');
    feedbackElement.textContent = i18next.t('submit.success');
    feedbackElement.classList.remove('text-danger');
    feedbackElement.classList.add('text-success');
  } else {
    fieldElement.classList.remove('is-valid');
    fieldElement.classList.add('is-invalid');
    feedbackElement.textContent = error;
    feedbackElement.classList.remove('text-success');
    feedbackElement.classList.add('text-danger');
  }
};

const renderSelectedPost = (elements, value) => {
  const { modalBody, modalTitle, followLinkBtn } = elements;
  const { title, description, link } = value;

  modalBody.textContent = '';
  modalBody.textContent = description;

  modalTitle.textContent = title;

  followLinkBtn.href = link;
  followLinkBtn.target = '_blank';
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
    }
  );

  container.textContent = '';
  container.append(rssTitleContainer);
};

const renderPosts = (content) => {
  const container = document.querySelector('.mx-auto.posts');
  container.textContent = '';
  Object.values(content.data.posts).forEach(({ id, title, link }) => {
    const postContainer = document.createElement('div');
    postContainer.classList.add('row', 'mb-3');

    const rssPostsContainer = document.createElement('div');
    rssPostsContainer.classList.add(
      'col',
      'posts',
      'd-flex',
      'justify-content-between',
      'align-items-center'
    );

    const rssPostElement = document.createElement('a');
    rssPostElement.textContent = title;
    rssPostElement.setAttribute('href', link);
    rssPostElement.setAttribute('target', '_blank');

    if (content.viewedLinks.includes(id)) {
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
      'add-post'
    );

    btnElement.textContent = i18next.t('view');

    rssPostsContainer.append(rssPostElement);
    rssPostsContainer.append(btnElement);

    postContainer.append(rssPostsContainer);
    container.appendChild(postContainer);
  });
};

export default (elements, initialState) => (path, value) => {
  switch (path) {
    case 'loadingProcess':
      handleProcessState(elements, value);
      break;

    case 'form':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
      renderProcessError(elements, initialState.form.errors);
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
