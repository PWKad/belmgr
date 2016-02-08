import {LogManager} from 'aurelia-framework';

var Config = {
  'baseUrl' : 'http://next.belframework.org/api',
  // 'baseUrl' : 'http://sitiyok:9292/api',
  'pubmedBaseUrl' : 'http://www.ebi.ac.uk/europepmc/webservices/rest/search',
  // append to loginUrl:  &redirect_uri=http://belmgr.belframework.org&state=#/search'
  'loginUrl' : 'https://openbel.auth0.com/login?client=K4oAPUaROjbWWTCoAhf0nKYfTGsZWbHE&protocol=oauth2&response_type=token&scope=openid%20profile',

  'tokenStorageName' : 'BELMgrToken',
  'tokenHeaderName' : 'Authorization',

  'logLevel' : LogManager.logLevel.debug
}

export default Config;