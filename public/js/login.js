import { showAlert } from './alerts';
export const login = async (email, password) => {
  try {
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();
    if (data.status === 'fail') throw new Error(data.message);
    if (data.status === 'success') {
      showAlert('success', 'logged in successfully');
      window.location.href = '/';
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.message);
  }
};

export const logout = async () => {
  try {
    const res = await fetch('/api/v1/users/logout');
    window.location.href = '/';
  } catch (err) {
    showAlert('error', 'Error logging out!Try again');
  }
};
