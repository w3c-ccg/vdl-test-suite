/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {join} = require('path');

const paths = {
  credentials: join(process.cwd(), 'credentials'),
  implementations: join(process.cwd(), 'implementations')
};

module.exports = {
  paths
};
