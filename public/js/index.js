import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { updatePassword } from './updateSettings';
const form = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const submitUpdate = document.querySelector('.form-user-data');
const formPassword = document.querySelector('.form-user-password');
if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;

    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', function (e) {
    logout();
  });
}

if (submitUpdate) {
  submitUpdate.addEventListener('submit', function (e) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);
    updateSettings(form);
  });
}

if (formPassword) {
  formPassword.addEventListener('submit', function (e) {
    e.preventDefault();
    const oldPassword = document.querySelector('#password-current').value;
    const newPassword = document.querySelector(
      '.form-user-password #password'
    ).value;
    updatePassword(oldPassword, newPassword);
  });
}
