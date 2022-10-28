import { config } from 'dotenv';
import { AuthenticationApi, ApiClient } from 'docusign-esign';
import { DS_AUTH_SERVICE_DEVELOPMENT_HOST, DS_AUTH_SERVICE_PRODUCTION_HOST } from '@homework-docusign-s3/types';
import { readFileSync } from 'fs';
import { join } from 'path';
describe('JWT auth', () => {
  let DS_USER_ID: string;
  let DS_API_ACCOUNT_ID: string;
  let DS_AUTH_JWT_KEY_PAIR_ID: string;
  let DS_AUTH_JWT_INTEGRATION_KEY: string;
  let DS_AUTH_JWT_REDIRECT_URL: string;


  beforeEach(() => {
    config({ path: join(process.cwd(), 'envs/.red.env') });
    ({
      DS_USER_ID,
      DS_API_ACCOUNT_ID,
      DS_AUTH_JWT_KEY_PAIR_ID,
      DS_AUTH_JWT_INTEGRATION_KEY,
      DS_AUTH_JWT_REDIRECT_URL,
    } = process.env);
  });


  it('Should make admin auth request', async () => {
    const apiClient = new ApiClient();
    const SCOPES = ['signature', 'impersonation'];

    apiClient.setOAuthBasePath(DS_AUTH_SERVICE_DEVELOPMENT_HOST.replace('https://', ''));

    const args = [
      DS_AUTH_JWT_INTEGRATION_KEY,
      DS_USER_ID,
      SCOPES,
      readFileSync(join(process.cwd(), 'secrets/docusign/jwt-auth/private-key.pem')),
      10 * 60] as const;

    try {

      const res = await apiClient.requestJWTUserToken(...args);

      expect(res.body.access_token).toBeDefined();
    } catch (error) {
      const body = error.response && error.response.body;

      if (body) {
        // The user needs to grant consent
        if (body.error && body.error === 'consent_required') {
          const consentUrl = `${DS_AUTH_SERVICE_DEVELOPMENT_HOST}/oauth/auth?response_type=code&` +
            `scope=${SCOPES.join('+')}&client_id=${DS_AUTH_JWT_INTEGRATION_KEY}&` +
            `redirect_uri=${'http://localhost:4200/docusign-redirect'}`;
          console.warn('='.repeat(20));
          console.warn('\n'.repeat(4));
          console.warn('YOU SHOULD GRANT CONSENT TO THE APPLICATION BY THIS URL (then repeat test');
          console.warn(consentUrl);
          console.warn('\n'.repeat(4));
          console.warn('='.repeat(20));
        } else {
          console.error(error);
          throw error;
        }
      }
    }
  }, 60 * 1000 * 3);
});
