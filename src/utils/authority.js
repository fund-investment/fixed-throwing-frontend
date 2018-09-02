// use localStorage to store the authority info, which might be sent from server in actual project.
import { queryAuth } from '../services/user';

export async function getAuthority() {
  // return localStorage.getItem('antd-pro-authority') || ['admin', 'user'];
  // return localStorage.getItem('antd-pro-authority');// || 'admin';
  const { auth } = await queryAuth();
  return auth;
}

export function setAuthority(authority) {
  return localStorage.setItem('antd-pro-authority', authority);
}
