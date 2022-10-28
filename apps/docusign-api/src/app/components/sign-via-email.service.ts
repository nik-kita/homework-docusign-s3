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
  pathToDoc2File: string,
  pathToDoc3File: string,
};

@Injectable()
export class SignViaEmailService {
  /**
 * This function does the work of creating the envelope
 */
  async sendEnvelope(args: {
    basePath: string,
    accessToken: string,
    accountId: string,
    envelopeArgs: MakeEnvelopeArgs,
  }) {
    // Data for this method
    // args.basePath
    // args.accessToken
    // args.accountId

    const dsApiClient = new ApiClient();
    dsApiClient.setBasePath(args.basePath);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);
    const envelopesApi = new EnvelopesApi(dsApiClient);
    let results = null;

    // Step 1. Make the envelope request body
    const envelope = this.makeEnvelope(args.envelopeArgs);

    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    results = await envelopesApi.createEnvelope(args.accountId, {
      envelopeDefinition: envelope,
    });
    const envelopeId = results.envelopeId;

    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return { envelopeId: envelopeId };
  }
  private makeEnvelope(args: MakeEnvelopeArgs): Envelope {
    const doc2DocxBytes = readFileSync(args.pathToDoc2File);
    const doc3PdfBytes = readFileSync(args.pathToDoc3File);

    // create the envelope definition
    const env = new docusign.EnvelopeDefinition();
    env.emailSubject = 'Please sign this document set';

    // add the documents
    const doc1 = new docusign.Document(),
      doc1b64 = Buffer.from(this.generateHtml(args)).toString('base64'),
      doc2b64 = Buffer.from(doc2DocxBytes).toString('base64'),
      doc3b64 = Buffer.from(doc3PdfBytes).toString('base64');
    doc1.documentBase64 = doc1b64;
    doc1.name = 'Order acknowledgement'; // can be different from actual file name
    doc1.fileExtension = 'html'; // Source data format. Signed docs are always pdf.
    doc1.documentId = '1'; // a label used to reference the doc

    // Alternate pattern: using constructors for docs 2 and 3...
    const doc2 = new docusign.Document.constructFromObject({
      documentBase64: doc2b64,
      name: 'Battle Plan', // can be different from actual file name
      fileExtension: 'docx',
      documentId: '2',
    });

    const doc3 = new docusign.Document.constructFromObject({
      documentBase64: doc3b64,
      name: 'Lorem Ipsum', // can be different from actual file name
      fileExtension: 'pdf',
      documentId: '3',
    });

    // The order in the docs array determines the order in the envelope
    env.documents = [doc1, doc2, doc3];

    // create a signer recipient to sign the document, identified by name and email
    // We're setting the parameters via the object constructor
    const signer1 = docusign.Signer.constructFromObject({
      email: args.signerEmail,
      name: args.signerName,
      recipientId: '1',
      routingOrder: '1',
    });
    // routingOrder (lower means earlier) determines the order of deliveries
    // to the recipients. Parallel routing order is supported by using the
    // same integer as the order for two or more recipients.

    // create a cc recipient to receive a copy of the documents, identified by name and email
    // We're setting the parameters via setters
    const cc1 = new docusign.CarbonCopy();
    cc1.email = args.ccEmail;
    cc1.name = args.ccName;
    cc1.routingOrder = '2';
    cc1.recipientId = '2';

    // Create signHere fields (also known as tabs) on the documents,
    // We're using anchor (autoPlace) positioning
    //
    // The DocuSign platform searches throughout your envelope's
    // documents for matching anchor strings. So the
    // signHere2 tab will be used in both document 2 and 3 since they
    // use the same anchor string for their "signer 1" tabs.
    const signHere1 = docusign.SignHere.constructFromObject({
      anchorString: '**signature_1**',
      anchorYOft: '10',
      anchorUnits: 'pixels',
      anchorXOft: '20',
    }),
      signHere2 = docusign.SignHere.constructFromObject({
        anchorString: '/sn1/',
        anchorYOft: '10',
        anchorUnits: 'pixels',
        anchorXOft: '20',
      });
    // Tabs are set per recipient / signer
    const signer1Tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signHere1, signHere2],
    });
    signer1.tabs = signer1Tabs;

    // Add the recipients to the envelope object
    const recipients = docusign.Recipients.constructFromObject({
      signers: [signer1],
      carbonCopies: [cc1],
    });
    env.recipients = recipients;

    // Request that the envelope be sent by setting |status| to "sent".
    // To request that the envelope be created as a draft, set to "created"
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
