import {AuthService} from 'aurelia-auth';
import {inject, LogManager} from 'aurelia-framework';
import {Api} from '../resources/api';

let logger = LogManager.getLogger('login');

@inject(AuthService, Api)
export class Login {

  msg = '';

  constructor(auth, api) {
    this.auth = auth;
    this.api = api;
    let tokens = window.location.search.split('?jwt=');
    if (tokens.length > 1) {
      let jwt = tokens[1];
      document.cookie = "token=" + jwt;
      window.location.href = "/";
    }
  };

  activate(params, routeConfig, navigationInstruction) {
    logger.debug('Params: ', params);
    this.msg = params.msg;
  }

  heading = 'Login';

  email='';
  password='';
  login() {
    this.api.authenticate();
  };
}
