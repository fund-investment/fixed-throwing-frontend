// TODO 临时放在localStorage中，便于调试
export function getAuthority() {
  let authority = localStorage.getItem('antd-pro-authority');
  if (authority) {
    authority = JSON.parse(authority);
  } else {
    authority = ['guest'];
  }
  return authority;
}

export function setAuthority(authority) {
  return localStorage.setItem('antd-pro-authority', JSON.stringify(authority));
}
