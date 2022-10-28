import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import {
  Envelope,
  ApiClient,
  EnvelopesApi,
} from 'docusign-esign';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const docusign = require('docusign-esign');

type MakeEnvelopeArgs = {
  signerEmail: string,
  signerName: string,
  ccEmail: string,
  ccName: string,
  status: string,
};

@Injectable()
export class SignViaEmailService {
  async sendEnvelope(args: {
    basePath: string,
    accessToken: string,
    accountId: string,
    envelopeArgs: MakeEnvelopeArgs,
  }) {
    const dsApiClient = new ApiClient();

    dsApiClient.setBasePath(args.basePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);

    const envelopesApi = new EnvelopesApi(dsApiClient);
    const envelope = this.makeEnvelope(args.envelopeArgs);
    let results = null;

    console.log(args);
    results = await envelopesApi.createEnvelope(args.accountId, {
      envelopeDefinition: envelope,
    });

    console.info(results);

    const envelopeId = results.envelopeId;

    return { envelopeId: envelopeId };
  }
  private makeEnvelope(args: MakeEnvelopeArgs): Envelope {
    const env = new docusign.EnvelopeDefinition();

    env.emailSubject = 'Please sign this document set';

    const doc1 = new docusign.Document();
    const doc1b64 = Buffer.from(this.generateHtml(args)).toString('base64');

    doc1.documentBase64 = doc1b64;
    doc1.name = 'Order acknowledgement';
    doc1.fileExtension = 'html';
    doc1.documentId = '1';

    env.documents = [doc1];

    const signer1 = docusign.Signer.constructFromObject({
      email: args.signerEmail,
      name: args.signerName,
      recipientId: '1',
      routingOrder: '1',
    });
    const cc1 = new docusign.CarbonCopy();

    cc1.email = args.ccEmail;
    cc1.name = args.ccName;
    cc1.routingOrder = '2';
    cc1.recipientId = '2';

    const signHere1 = docusign.SignHere.constructFromObject({
      anchorString: '**signature_1**',
      anchorYOft: '10',
      anchorUnits: 'pixels',
      anchorXOft: '20',
    });

    const signer1Tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signHere1],
    });
    signer1.tabs = signer1Tabs;
    const recipients = docusign.Recipients.constructFromObject({
      signers: [signer1],
      carbonCopies: [cc1],
    });

    env.recipients = recipients;
    env.status = args.status;

    return env;
  }

  private generateHtml(args: {
    signerName: string,
    signerEmail: string,
    ccName: string,
    ccEmail: string,
  }): string {
    // TODO replace with actual payload
    return `
      <!DOCTYPE html>
      <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family:sans-serif;margin-left:2em;">
          <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
              color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
          <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
            color: darkblue;">Order Processing Division</h2>
          <h4>Ordered by ${args.signerName}</h4>
          <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
          <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
          <p style="margin-top:3em;">
    Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
          </p>
          <!-- Note the anchor tag for the signature field is in white. -->
          <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
          </body>
      </html>
    `;
  }
}
