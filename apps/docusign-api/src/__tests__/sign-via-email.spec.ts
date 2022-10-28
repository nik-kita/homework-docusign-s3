import { DS_AUTH_SERVICE_DEVELOPMENT_HOST, DS_DEMO_BASE_PATH } from '@homework-docusign-s3/types';
import { ApiClient } from 'docusign-esign';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SignViaEmailService } from '../app/components/sign-via-email.service';

describe('Sign via email', () => {
  let signViaEmailService: SignViaEmailService;
  let accessToken: string;
  let accountId: string;

  beforeAll(async () => {
    const apiClient = new ApiClient();

    apiClient.setOAuthBasePath(DS_AUTH_SERVICE_DEVELOPMENT_HOST.replace('https://', ''));
    config({ path: join(process.cwd(), 'envs/.red.env') });

    const {
      DS_USER_ID,
      DS_AUTH_JWT_INTEGRATION_KEY,
    } = process.env;
    const {
      body: account_info,
    } = await apiClient.requestJWTUserToken(
      DS_AUTH_JWT_INTEGRATION_KEY,
      DS_USER_ID,
      ['signature', 'impersonation'],
      readFileSync(join(process.cwd(), 'secrets/docusign/jwt-auth/private-key.pem')),
      0,
    );

    console.info(account_info);

    accessToken = account_info.access_token;
    signViaEmailService = new SignViaEmailService();

    // TODO type
    const info = await apiClient.getUserInfo(accessToken);

    // TODO beautify, type
    accountId = info.accounts[0].accountId;
  });


  it('test 1', async () => {
    try {

      const res = await signViaEmailService.sendEnvelope({
        accessToken,
        accountId,
        basePath: DS_DEMO_BASE_PATH,
        envelopeArgs: {
          signerEmail: 'one.of.these.shoes.isnt.right@gmail.com',
          signerName: 'Richard Sho',
          ccEmail: 'jamesfenimorecooper1789.1851@gmail.com',
          ccName: 'James Cooper',
          status: 'sent',
        }
      });

      expect(res.envelopeId).toBeDefined();
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
});
