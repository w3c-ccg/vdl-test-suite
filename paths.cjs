/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {join} = require('path');

const paths = {
  certificates: join(process.cwd(), 'certificates'),
  implementations: join(process.cwd(), 'implementations')
};

module.exports = {
  paths
};
