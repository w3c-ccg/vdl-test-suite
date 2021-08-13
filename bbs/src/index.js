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
import {sign, verify, purposes} from 'jsonld-signatures';

import _keyPairOptions from './data/keyPair.json';
import _disclosures from './data/deriveProofFrame.json';

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
  documentLoader,
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
    inputDocument,
    derivedProof,
    verified
  };
};
