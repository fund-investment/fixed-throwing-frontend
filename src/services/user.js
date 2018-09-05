import request from '@/utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/api/currentUser');
}

export async function queryAuth() {
  return request('/api/user/get_auth');
}

export async function login(params) {
  return request('/api/user/login', {
    method: 'POST',
    body: params,
  });
}

export async function logout(params) {
  return request('/api/user/logout', {
    method: 'POST',
    body: params,
  });
}
