/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import * as didKeyDriver from '@digitalbazaar/did-method-key';
import {CONTEXT_URL} from 'vdl-context';
import {join} from 'path';
import {paths} from './paths.js';
import stateList from './states.js';
import {writeJSON} from './files.js';

async function createVC(state) {
  const contexts = [
    'https://www.w3.org/2018/credentials/v1',
    CONTEXT_URL,
  ];
  const type = [
    'VerifiableCredential',
    'Iso18013DriversLicenseCredential'
  ];
  const fileName = `${state.name}.json`;
  const {didDocument} = await didKeyDriver.generate();
  const credential = {
    '@context': contexts,
    type,
    credentialSubject: {
      id: didDocument.id,
      license: {
        type: 'Iso18013DriversLicense',
        document_number: '542426814',
        family_name: 'TURNER',
        given_name: 'SUSAN',
        portrait: '/9j/4AAQSkZJRgABAQEAkACQA...gcdgck5HtRRSClooooP/2Q==',
        birth_date: '1998-08-28',
        issue_date: '2018-01-15T10:00:00Z',
        expiry_date: '2022-08-27T12:00:00Z',
        issuing_country: 'US',
        issuing_authority: state.code,
        driving_privileges: [{
          codes: [{code: 'D'}],
          vehicle_category_code: 'D',
          issue_date: '2019-01-01',
          expiry_date: '2027-01-01'
        },
        {
          codes: [{code: 'C'}],
          vehicle_category_code: 'C',
          issue_date: '2019-01-01',
          expiry_date: '2017-01-01'
        }],
        un_distinguishing_sign: 'USA',
      }
    }
  };
  return {fileName, credential};
}

/**
 * Formats data into VCs.
 *
 * @returns {Promise} Writes data to `/credentials` and exits.
*/
async function generateCertificates() {
  try {
    await Promise.all(stateList.flatMap(async state => {
      const {fileName, credential} = await createVC(state);
      const filePath = join(paths.credentials, fileName);
      return writeJSON({path: filePath, data: credential});
    }));
  } catch(e) {
    console.error(e);
  }
}

generateCertificates();
