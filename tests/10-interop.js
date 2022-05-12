/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const vpqr = require('@digitalbazaar/vpqr');
const chai = require('chai');
const filesize = require('file-size');
const Implementation = require('./implementation');
const {testCredential} = require('./assertions');
const certificates = require('../credentials');
const allVendors = require('../implementations');
const {documentLoader} = require('./loader.js');
const {createCompressedVC, deepClone} = require('./helpers');
const {createBBSreport} = require('../bbs/src');

const should = chai.should();

// test these implementations' issuers or verifiers
const test = [
  'Digital Bazaar',
  'MATTR',
  'Spruce'
];

// only test listed implementations
const implementations = allVendors.filter(v => test.includes(v.name));

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
      this.implemented = columnNames;
      this.rowLabel = 'Issuer';
      this.columnLabel = 'Verifier';
      // this will be displayed under the test title
      this.reportData = reportData;
      this.images = images;

      // after the suite runs add a compressed image
      after(async function() {
        const compressedVP = await createCompressedVC(
          {certificate, documentLoader});
        const [_vc] = compressedVP.verifiableCredential;
        // format VC so context is first in examples
        let vc = deepClone(_vc);
        vc = {'@context': _vc['@context'], ..._vc};
        // remove driving privleges to avoid a CBOR-LD error
        delete vc.credentialSubject.license.driving_privileges;
        delete vc.credentialSubject.license.portrait;
        reportData[0] = {
          label: `Verifiable Driver\'s License with an Ed25519 ` +
            `digital signature (${license.issuing_authority})`,
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
        const inputDocument = {...certificate};
        inputDocument['@context'].push('https://w3id.org/security/bbs/v1');
        // after the suite runs add a BBS+ disclosure report
        const {
          signedDocument,
          disclosures,
          derivedProof,
          verified
        } = await createBBSreport({inputDocument});
        reportData.push({
          label: `A Verifiable Driver's License with a BBS+ digital ` +
            `signature (${license.issuing_authority})`,
          data: JSON.stringify(signedDocument, null, 2)
        });
        reportData.push({
          label: `Selective disclosures for the BBS+ vDL ` +
            `(${license.issuing_authority})`,
          data: JSON.stringify(disclosures, null, 2)
        });
        reportData.push({
          label: `A BBS+ derived proof for the selective disclosures ` +
            `(${license.issuing_authority})`,
          data: JSON.stringify(derivedProof, null, 2)
        });
        reportData.push({
          label: `The verification result of the BBS+ derived proof ` +
            `(${license.issuing_authority})`,
          data: JSON.stringify(verified, null, 2)
        });
      });
      for(const issuer of implementations) {
        // this is the credential for the verifier tests
        let credential = null;
        //FIXME issuerResponse should be used to check status 201
        //let issuerResponse = null;
        let error = null;
        describe(issuer.name, function() {
          before(async function() {
            try {
              // ensure this implementation is a column in the matrix
              columnNames.push(issuer.name);
              const implementation = new Implementation(issuer);
              const response = await implementation.issue(
                {credential: certificate});
              //FIXME issuerResponse should be used to check status 201
              //issuerResponse = response;
              // this credential is not tested
              // we just send it to each verifier
              credential = response.data;
              // if the response.data is not directly jsonld unwrap it
              if(!credential['@context']) {
                for(const key of Object.keys(credential)) {
                  const prop = credential[key];
                  // when we find the first context that should be the VC
                  if(prop['@context']) {
                    // set the credential as the first object with an `@context`
                    credential = prop;
                    break;
                  }
                }
              }
            } catch(e) {
              console.error(`${issuer.name} failed to issue a ` +
                'credential for verification tests', e);
              error = e;
            }
          });
          // this ensures the implementation issuer
          // issues correctly
          it(`should be issued by ${issuer.name}`, async function() {
            should.exist(
              credential, `Expected VC from ${issuer.name} to exist.`);
            should.not.exist(error, `Expected ${issuer.name} to not error.`);

            // FIXME issuer should return 201
            //issuerResponse.status.should.equal(201);

            testCredential(credential);
            credential.credentialSubject.should.eql(
              certificate.credentialSubject);
            const verifiableCredential = JSON.parse(JSON.stringify(credential));
            // remove portrait as we can't reduce it to binary right now
            delete verifiableCredential.credentialSubject.license.portrait;
            // FIXME remove driving_privileges until we have a cbor
            // schema for them
            delete verifiableCredential.credentialSubject.
              license.driving_privileges;
            const vp = {
              '@context': 'https://www.w3.org/2018/credentials/v1',
              type: 'VerifiablePresentation',
              verifiableCredential
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
              // verifier responses vary but are all objects
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
