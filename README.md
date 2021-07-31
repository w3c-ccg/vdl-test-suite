# Verifiable Driver's License Test Suite

A few of the members in the W3C Credentials Community Group have been
working on a
[Verifiable Driver's License Vocabulary](https://w3c-ccg.github.io/vdl-vocab/).

The CCG has also been working on a
[Verifiable Credentials HTTP API](https://github.com/w3c-ccg/vc-http-api).

Please note:

* This is all experimental; it's not meant to step on any toes (existing mDL
  work -- we are striving to be compatible with the mDL data model).
* There is no guarantee that mDL will follow any particular path at this moment.

The test report output can be found here:

https://w3id.org/vdl/interop-reports

## Install

Installation is pretty simple:

1. Install the `node_modules`.
2. Generate test Driver's Licenses.
3. Generate the latest certificates.

The following commands should do the above:
```
npm i
npm run generate-vdls
```
