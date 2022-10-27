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

    apiClient.setOAuthBasePath(DS_AUTH_SERVICE_PRODUCTION_HOST.replace('https://', ''));

    const args = [
      DS_USER_ID,
      'd734e493-499b-47f0-a049-defe436c9b5c',
      ['signature', 'impersonation'] as string[],
      readFileSync(join(process.cwd(), 'secrets/docusign/jwt-auth/private-key.pem')),
      10 * 60] as const;

    try {

      const res = await apiClient.requestJWTUserToken(...args);

      console.log(res);

      expect(res).toBeDefined();

    } catch (error) {
      console.error(error);
      throw error;
    }
  }, 60 * 1000 * 10);
});
