import { DS_AUTH_SERVICE_DEVELOPMENT_HOST } from '@homework-docusign-s3/types';
import { ApiClient } from 'docusign-esign';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
describe('Docusign jwt auth', () => {
  let DS_USER_ID: string;
  let DS_AUTH_JWT_INTEGRATION_KEY: string;
  let DS_AUTH_JWT_REDIRECT_URL: string;


  beforeEach(() => {
    config({ path: join(process.cwd(), 'envs/.red.env') });
    ({
      DS_USER_ID,
      DS_AUTH_JWT_INTEGRATION_KEY,
      DS_AUTH_JWT_REDIRECT_URL,
    } = process.env);
  });


  it('Check credentials, make sdk.requestJWTUserToken()', async () => {
    const apiClient = new ApiClient();
    const SCOPES = ['signature', 'impersonation'];

    apiClient.setOAuthBasePath(DS_AUTH_SERVICE_DEVELOPMENT_HOST.replace('https://', ''));

    const args = [
      DS_AUTH_JWT_INTEGRATION_KEY,
      DS_USER_ID,
      SCOPES,
      readFileSync(join(process.cwd(), 'secrets/docusign/jwt-auth/private-key.pem')),
      0, // ti looks like this parameter is ignored during jwt auth flow
    ] as const;

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
            `redirect_uri=${DS_AUTH_JWT_REDIRECT_URL}`;

          console.warn(
            '='.repeat(20),
            '\nYOU SHOULD GRANT CONSENT TO THE APPLICATION BY THIS URL (then repeat test)',
            '\n'.repeat(4),
            consentUrl,
            '\n'.repeat(4),
            '='.repeat(20),
          );

          expect('here').not.toBe('here');
        } else {
          console.error(error);

          throw error;
        }
      }
    }
  }, 60 * 1000 * 3);
});
