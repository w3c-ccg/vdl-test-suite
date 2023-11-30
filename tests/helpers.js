/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import * as vc from '@digitalbazaar/vc';
import {driver} from '@digitalbazaar/did-method-key';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {klona} from 'klona';
import {v4 as uuidv4} from 'uuid';

const didKeyDriver = driver();

export function createIssuerBody({issuer, vc}) {
  const _vc = klona(vc);
  const {settings: {id, options}} = issuer;
  _vc.issuer = id;
  _vc.id = `urn:uuid:${uuidv4()}`;
  _vc.expirationDate = ISOTimeStamp({
    date: new Date(Date.now() + 60 * 60 * 24 * 7 * 52 * 3 * 1000)
  });
  return {
    credential: _vc,
    options
  };
}

export function createVerifierBody({vc}) {
  return {
    verifiableCredential: vc,
    options: {
      checks: ['proof'],
    }
  };
}

export const createCompressedVC = async ({certificate, documentLoader}) => {
  const {didDocument, keyPairs} = await didKeyDriver.generate();
  const vm = didDocument.verificationMethod.find(vm => vm.id);
  const keyPair = keyPairs.get(vm.id);
  const suite = new Ed25519Signature2020({key: keyPair});
  const credential = {
    issuer: vm.id,
    issuanceDate: new Date().toISOString(),
    ...certificate
  };
  const verifiableCredential = await vc.issue({
    credential,
    suite,
    documentLoader
  });
  return vc.createPresentation({verifiableCredential, documentLoader});
};

// Javascript's default ISO timestamp is contains milliseconds.
// This lops off the MS part of the UTC RFC3339 TimeStamp and replaces
// it with a terminal Z.
export function ISOTimeStamp({date = new Date()} = {}) {
  return date.toISOString().replace(/\.\d+Z$/, 'Z');
}
