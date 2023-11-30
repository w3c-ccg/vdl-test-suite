/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */

import {CONTEXT_URL as testContextUri, CONTEXT} from 'vdl-context';
import citContext from 'cit-context';
import cred from 'credentials-context';
import didContext from 'did-context';
import {driver} from '@digitalbazaar/did-method-key';
import ed25519 from 'ed25519-signature-2020-context';
import {JsonLdDocumentLoader} from 'jsonld-document-loader';
import revocationContext from 'vc-revocation-list-context';
import securityContext from '@digitalbazaar/security-context';
import x25519 from 'x25519-key-agreement-2020-context';

import _keyPairOptions from '../bbs/src/data/keyPair.json' assert { type: 'json' };
import exampleControllerDoc from '../bbs/src/data/controllerDocument.json' assert { type: 'json' };
import bbsContext from '../bbs/src/data/bbs.json' assert { type: 'json' };
import jwsContext from '../bbs/src/data/jwsContext.json' assert { type: 'json' };

const {contexts: credentialsContext, constants: {CREDENTIALS_CONTEXT_V1_URL}} =
  cred;
const {VC_REVOCATION_LIST_CONTEXT_V1_URL} = revocationContext.constants;

const staticLoader = new JsonLdDocumentLoader();
staticLoader.addStatic(ed25519.constants.CONTEXT_URL,
  ed25519.contexts.get(ed25519.constants.CONTEXT_URL));

staticLoader.addStatic(x25519.constants.CONTEXT_URL,
  x25519.contexts.get(x25519.constants.CONTEXT_URL));

staticLoader.addStatic(citContext.constants.CONTEXT_URL,
  citContext.contexts.get(citContext.constants.CONTEXT_URL));

staticLoader.addStatic(didContext.constants.DID_CONTEXT_URL,
  didContext.contexts.get(didContext.constants.DID_CONTEXT_URL));

staticLoader.addStatic(VC_REVOCATION_LIST_CONTEXT_V1_URL,
  revocationContext.contexts.get(VC_REVOCATION_LIST_CONTEXT_V1_URL));

staticLoader.addStatic(CREDENTIALS_CONTEXT_V1_URL,
  credentialsContext.get(CREDENTIALS_CONTEXT_V1_URL));

staticLoader.addStatic(securityContext.constants.CONTEXT_URL,
  securityContext.contexts.get(securityContext.constants.CONTEXT_URL));

staticLoader.addStatic(testContextUri, CONTEXT);

staticLoader.addStatic('did:example:489398593#test', _keyPairOptions);
staticLoader.addStatic('did:example:489398593', exampleControllerDoc);
staticLoader.addStatic('https://w3id.org/security/bbs/v1', bbsContext);
staticLoader.addStatic('https://w3id.org/security/v2', bbsContext);
staticLoader.addStatic(
  'https://w3id.org/security/suites/jws-2020/v1', jwsContext);

const didKeyDriver = driver();

export const documentLoader = async url => {
  if(url && url.startsWith('did:key:')) {
    const document = await didKeyDriver.get({url});
    return {
      contextUrl: null,
      document,
      documentUrl: url,
      tag: 'static'
    };
  }

  return staticLoader.documentLoader(url);
};
