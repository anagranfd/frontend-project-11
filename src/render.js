import has from 'lodash/has.js';

const handleProcessState = (elements, processState) => {
  switch (processState) {
    case 'added':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
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

const renderErrors = (elements, errors, prevError) => {
  const [fieldName, fieldElement] = Object.entries(elements.fields)[0];
  const { feedbackElement } = elements;
  const error = errors[fieldName];
  const fieldHadError = has(prevError, fieldName);
  const fieldHasError = has(errors, fieldName);

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
  const fieldHadSuccess = prevValue !== null;
  const fieldHasSuccess = value !== null;

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
    feedbackElement.textContent = value.message;
  }
};

export default (elements, initialState) => (path, value, prevValue) => {
  switch (path) {
    case 'signupProcess.processState':
      handleProcessState(elements, value);
      break;

    case 'form.successFeedback':
      renderSuccessFeedback(elements, value);
      break;

    case 'signupProcess.processError':
      elements.submitButton.disabled = false;
      elements.fields.link.disabled = false;
      renderProcessError(elements, value, prevValue, initialState);
      break;

    case 'form.valid':
      elements.submitButton.disabled = !value;
      break;

    case 'form.errors':
      renderErrors(elements, value, prevValue, initialState);
      break;

    default:
      break;
  }
};
