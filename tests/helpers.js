import vc from '@digitalbazaar/vc';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';

const didKeyDriver = require('@digitalbazaar/did-method-key').driver();

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
