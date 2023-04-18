import { showAlert } from './alerts';
import axios from 'axios';
export const updateSettings = async (obj) => {
  console.log(obj);
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/updateMe',
      data: obj,
    });
    showAlert('success', 'Data updated!');
    setTimeout(() => location.reload(true), 1500);
    if (res.data.status === 'error') throw new Error(data.error.message);

    //location.reload(true);
  } catch (err) {
    showAlert('error', err.message);
  }
};

export const updatePassword = async (oldPassword, newPassword) => {
  try {
    const res = await fetch(`/api/v1/users/updateMyPassword`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: oldPassword,
        newPassword,
      }),
    });
    const data = await res.json();
    console.log(data);
    if (data.status === 'fail') throw new Error(data.message);
    if (data.status === 'success') {
      showAlert('success', 'Password Changed Successfully');
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', err);
  }
};
