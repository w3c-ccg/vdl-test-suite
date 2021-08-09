/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const vpqr = require('@digitalbazaar/vpqr');

import * as chai from 'chai';
import filesize from 'file-size';
import Implementation from './implementation.cjs';
import {testCredential} from './assertions.js';
import certificates from '../certificates.cjs';
import allVendors from '../implementations.cjs';
import {documentLoader} from './loader.js';
import {createCompressedVC} from './helpers.js';

const should = chai.should();
// do not test these implementations' issuers or verifiers
const notTest = [
  'Danube Tech',
  //'Digital Bazaar',
  'Mavennet',
  'Mattr Labs',
  'mesur.io',
  'Dock',
  'Factom',
  'SICPA',
  'Spherity',
  // Error: "Credential could not be verified" for mulitple VCs
  // from multiple vendors.
  'Trybe',
  // verifier returns 404 for all credentials
  'Trustbloc',
  'Transmute',
  // Unable to filter proofs: method-not-supported for multiple VCs
  // from different vendors (was able to verify themselves, Mattr, & others)
  'Spruce'
];

// remove the notTest implementations

const implementations = allVendors.filter(v => !notTest.includes(v.name));

describe('Verifiable Driver\'s License Credentials', function() {
  const summaries = new Set();
  this.summary = summaries;
  for(const certificate of certificates) {
    const {credentialSubject: {license}} = certificate;
    describe(license.issuing_authority, function() {
      // column names for the matrix go here
      const columnNames = [];
      const reportData = [];
      const images = [];
      // this will tell the report
      // to make an interop matrix with this suite
      this.matrix = true;
      this.report = true;
      this.columns = columnNames;
      this.rowLabel = 'Issuer';
      this.columnLabel = 'Verfier';
      // this will be displayed under the test title
      this.reportData = reportData;
      this.images = images;

      // this is the credential for the verifier tests
      let credential = null;
      // after the suite runs add a compressed image
      after(async function() {
        const compressedVP = await createCompressedVC(
          {certificate, documentLoader});
        const [_vc] = compressedVP.verifiableCredential;
        // format VC so context is first in examples
        const vc = {'@context': _vc['@context'], ..._vc};
        reportData[0] = {
          label: certificate.name,
          data: JSON.stringify(vc, null, 2)
        };
        const compressedQr = await vpqr.toQrCode({
          vp: compressedVP,
          documentLoader,
          //diagnose: console.log
        });
        // FIXME add once full compression is in place
        const compression = 'CBOR-LD: ' +
        filesize(compressedQr.rawCborldBytes.length, {fixed: 0}).human();
        const meta = [
          compression,
          `QR Code: v${compressedQr.version}`,
          'Encoding: base32 alphanumeric'
        ];
        images.push({src: compressedQr.imageDataUrl, meta});
      });
      for(const issuer of implementations) {
        describe(issuer.name, function() {
          before(async function() {
            try {
              // ensure this implementation is a column in the matrix
              columnNames.push(issuer.name);
              const implementation = new Implementation(issuer);
              const response = await implementation.issue(
                {credential: certificate});
              should.exist(response);
              // this credential is not tested
              // we just send it to each verifier
              credential = response.data;
            } catch(e) {
              console.error(`${issuer.name} failed to issue a ` +
                'credential for verification tests', e);
              throw e;
            }
          });
          // this ensures the implementation issuer
          // issues correctly
          it(`should be issued by ${issuer.name}`, async function() {
            const implementation = new Implementation(issuer);
            const response = await implementation.issue(
              {credential: certificate});
            should.exist(response);
            //response.status.should.equal(201);
            testCredential(response.data);
            credential = response.data;
            credential.credentialSubject.should.eql(
              certificate.credentialSubject);
            // remove portrait as we can't reduce it to binary right now
            delete credential.credentialSubject.portrait;
            const vp = {
              '@context': 'https://www.w3.org/2018/credentials/v1',
              type: 'VerifiablePresentation',
              verifiableCredential: credential
            };
            const {
              payload,
              //version,
              imageDataUrl,
              //rawCborldBytes
            } = await vpqr.toQrCode({
              vp,
              documentLoader,
              //diagnose: console.log
            });
            should.exist(payload, 'Expected there to be a qr payload');
            should.exist(imageDataUrl, 'Expected QR Code data url');
            const {vp: actualVP} = await vpqr.fromQrCode({
              text: payload,
              documentLoader
            });
            should.exist(actualVP);
            actualVP.should.be.an(
              'object', 'Expected actualVP to be an object');
            actualVP.should.eql(vp);
            // use the DB Data in the test suite
          });
          // this sends a credential issued by the implementation
          // to each verifier
          for(const verifier of implementations) {
            const testTitle = `should be verified by ${verifier.name}`;
            it(testTitle, async function() {
              // this tells the test report which cell
              // in the interop matrix the result goes in
              this.test.cell = {columnId: verifier.name, rowId: issuer.name};
              should.exist(credential);
              const implementation = new Implementation(verifier);
              const response = await implementation.verify({credential});
              should.exist(response);
              // verifier returns 200
              response.status.should.equal(200);
              should.exist(response.data);
              // verifier reponses vary but are all objects
              response.data.should.be.an('object');
            });
          }
        });
      }
    });
  }
  after(function() {
    // add summary of certificates and implementations used
    summaries.add(
      'This suite issued & verified credentials for' +
         ` ${certificates.length} U.S. states.`);
    summaries.add(`These credentials were issued & verified by` +
        ` ${implementations.length} implementations.`);
  });
});
