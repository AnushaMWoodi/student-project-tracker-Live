async function request(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      `API request failed (HTTP ${response.status}): expected JSON but received ${contentType || 'an unknown content type'}. Check that the Vercel deployment runs the Express app and includes its API routes.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

const store = {
  list: () => request('/api/projects'),
  create: project => request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  }),
  update: (id, project) => request(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project)
  }),
  remove: id => request(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
};

const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');
const projectNamePicker = document.querySelector('#project-name-picker');
const projectNameOptions = document.querySelector('#project-name-options');

let editingId = null;
let busy = false;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.dataset.error = String(isError);
}

function setBusy(value) {
  busy = value;
  form.querySelectorAll('input, select, button').forEach(control => {
    control.disabled = value;
  });
  projectList.querySelectorAll('button').forEach(button => {
    button.disabled = value;
  });
}

function setAddMode() {
  editingId = null;
  form.reset();
  saveButton.textContent = 'Add project';
  cancelButton.textContent = 'Cancel edit';
  cancelButton.hidden = true;
}

function startEditing(project) {
  if (busy) {
    return;
  }

  editingId = project.id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  nameInput.focus();
}

function hideProjectNameOptions() {
  projectNameOptions.hidden = true;
}

function showProjectNameOptions() {
  if (projectNameOptions.childElementCount > 0) {
    projectNameOptions.hidden = false;
  }
}

async function refreshProjects() {
  const projects = await store.list();
  projectList.replaceChildren();
  projectNameOptions.replaceChildren();

  for (const project of projects) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'project-name-option';
    option.setAttribute('role', 'option');
    option.textContent = project.name;
    option.addEventListener('click', () => {
      nameInput.value = project.name;
      hideProjectNameOptions();
      nameInput.focus();
    });
    projectNameOptions.append(option);
  }

  for (const project of projects) {
    const item = document.createElement('li');
    const details = document.createElement('div');
    const name = document.createElement('h3');
    const status = document.createElement('p');
    const actions = document.createElement('div');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    details.className = 'project-details';
    name.className = 'project-name';
    name.textContent = project.name;
    status.className = 'project-status';
    status.textContent = project.status;
    details.append(name, status);

    actions.className = 'project-actions';

    editButton.type = 'button';
    editButton.className = 'edit-button';
    editButton.textContent = 'Edit';
    editButton.setAttribute('aria-label', `Edit ${project.name}`);
    editButton.addEventListener('click', () => startEditing(project));

    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${project.name}`);
    deleteButton.addEventListener('click', async () => {
      if (busy || !window.confirm(`Delete "${project.name}"?`)) {
        return;
      }

      setBusy(true);
      showMessage('Deleting project...');

      try {
        await store.remove(project.id);
        if (editingId === project.id) {
          setAddMode();
        }
        await refreshProjects();
        showMessage('Project deleted.');
      } catch (error) {
        showMessage(`${error.message} Check that the server is running.`, true);
      } finally {
        setBusy(false);
      }
    });

    actions.append(editButton, deleteButton);
    item.className = 'project-item';
    item.append(details, actions);
    projectList.append(item);
  }

  emptyState.hidden = projects.length > 0;
}

projectNamePicker.addEventListener('mouseenter', showProjectNameOptions);
projectNamePicker.addEventListener('mouseleave', hideProjectNameOptions);
nameInput.addEventListener('focus', showProjectNameOptions);
projectNamePicker.addEventListener('focusout', event => {
  if (!projectNamePicker.contains(event.relatedTarget)) {
    hideProjectNameOptions();
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();

  if (busy) {
    return;
  }

  const project = {
    name: nameInput.value.trim(),
    status: statusInput.value
  };

  if (!project.name) {
    nameInput.reportValidity();
    return;
  }

  setBusy(true);
  showMessage('Saving project...');

  try {
    if (editingId === null) {
      await store.create(project);
    } else {
      await store.update(editingId, project);
    }

    setAddMode();
    await refreshProjects();
    showMessage('Project saved.');
  } catch (error) {
    showMessage(`${error.message} Check that the server is running.`, true);
  } finally {
    setBusy(false);
  }
});

cancelButton.addEventListener('click', setAddMode);

setBusy(true);
showMessage('Loading projects...');
refreshProjects()
  .then(() => showMessage('Ready.'))
  .catch(error => showMessage(`${error.message} Check that the server is running.`, true))
  .finally(() => setBusy(false));
