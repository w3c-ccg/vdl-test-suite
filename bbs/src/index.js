/*
 * Copyright 2020 - MATTR Limited
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Bls12381G2KeyPair,
  BbsBlsSignature2020,
  BbsBlsSignatureProof2020,
  deriveProof
} from '@mattrglobal/jsonld-signatures-bbs';
import {extendContextLoader, sign, verify, purposes} from 'jsonld-signatures';

import _keyPairOptions from './data/keyPair.json';
import _disclosures from './data/deriveProofFrame.json';
import exampleControllerDoc from './data/controllerDocument.json';
import bbsContext from './data/bbs.json';
import credentialContext from './data/credentialsContext.json';
import jwsContext from './data/jwsContext.json';
import {CONTEXT_URL as vdlContextUri, CONTEXT} from 'vdl-context';

const documents = {
  'did:example:489398593#test': _keyPairOptions,
  'did:example:489398593': exampleControllerDoc,
  'https://w3id.org/security/bbs/v1': bbsContext,
  'https://www.w3.org/2018/credentials/v1': credentialContext,
  'https://w3id.org/security/suites/jws-2020/v1': jwsContext,
  [vdlContextUri]: CONTEXT
};

const customDocLoader = url => {
  const context = documents[url];

  if(context) {
    return {
      contextUrl: null, // this is for a context via a link header
      document: context, // this is the actual document that was loaded
      documentUrl: url // this is the actual context URL after redirects
    };
  }

  console.log(
    `Attempted to remote load context : '${url}', please cache instead`
  );
  throw new Error(
    `Attempted to remote load context : '${url}', please cache instead`
  );
};

//Extended document load that uses local contexts
const _documentLoader = extendContextLoader(customDocLoader);

/**
 * Creates a BBS+ report for a VC.
 *
 * @param {object} options - Options to use.
 * @param {object} options.inputDocument - A verifiable credential.
 * @param {Function<Promise<object>>} options.documentLoader - A documentLoader.
 * @param {object} [options.keyPairOptions = _keyPairOptions] - Options for a
 *   Bls12381G2KeyPair.
 * @param {object} [options.disclosures = _disclosures] - A jsonld frame with
 *   the desired disclosures for a VC.
 *
 * @returns {Promise<object>} - Results for the report.
 */
export const createBBSreport = async ({
  inputDocument,
  documentLoader = _documentLoader,
  keyPairOptions = _keyPairOptions,
  disclosures = _disclosures
}) => {
  //Import the example key pair
  const keyPair = await new Bls12381G2KeyPair(keyPairOptions);

  //Sign the input document
  const signedDocument = await sign(inputDocument, {
    suite: new BbsBlsSignature2020({key: keyPair}),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader
  });

  //Verify the proof
  let verified = await verify(signedDocument, {
    suite: new BbsBlsSignature2020(),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader
  });
  console.log({signedDocument, disclosures});
  //Derive a proof
  const derivedProof = await deriveProof(signedDocument, disclosures, {
    suite: new BbsBlsSignatureProof2020(),
    documentLoader
  });

  //Verify the derived proof
  verified = await verify(derivedProof, {
    suite: new BbsBlsSignatureProof2020(),
    purpose: new purposes.AssertionProofPurpose(),
    documentLoader
  });
  return {
    signedDocument,
    disclosures,
    derivedProof,
    verified
  };
};
