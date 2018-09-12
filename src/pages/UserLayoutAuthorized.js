import React from 'react';
import { formatMessage } from 'umi/locale';
import Redirect from 'umi/redirect';
import { connect } from 'dva';
import { getAuthority } from '../utils/authority';

const Auth = ({ children }) => {
  if (['member', 'god'].includes(getAuthority())) {
    return <Redirect to="/" />;
  }
  return children;
};

export default connect(({ login }) => ({
  loginStatus: login.status,
}))(Auth);
