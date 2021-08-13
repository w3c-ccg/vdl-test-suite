/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const didKey = require('@digitalbazaar/did-method-key');
const citContext = require('cit-context');
const didContext = require('did-context');
const revocationContext = require('vc-revocation-list-context');
const ed25519 = require('ed25519-signature-2020-context');
const x25519 = require('x25519-key-agreement-2020-context');
const cred = require('credentials-context');
const securityContext = require('@digitalbazaar/security-context');
const {JsonLdDocumentLoader} = require('jsonld-document-loader');
const {CONTEXT_URL: testContextUri, CONTEXT} = require('vdl-context');
const _keyPairOptions = require('../bbs/src/data/keyPair.json');
const exampleControllerDoc = require('../bbs/src/data/controllerDocument.json');
const bbsContext = require('../bbs/src/data/bbs.json');
const jwsContext = require('../bbs/src/data/jwsContext.json');

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

const didKeyDriver = didKey.driver();

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
