import React from 'react';
import RenderAuthorized from '@/components/Authorized';
import { formatMessage } from 'umi/locale';
import Redirect from 'umi/redirect';
import { connect } from 'dva';
import {getAuthority} from "../utils/authority";

const Authorized = RenderAuthorized(['admin', 'user']);

const Auth = ({ children, loginStatus }) => {

  const noMatch = (
    <Redirect to="/user/login" />
  );

  console.log(loginStatus)
  console.log(getAuthority())
  return (
    <Authorized
      authority={getAuthority()}
      noMatch={noMatch}
    >
      {children}
    </Authorized>
  );
};

export default connect(({ login }) => ({
  loginStatus: login.status,
}))(Auth);
