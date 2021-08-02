/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const requireDir = require('require-dir');

const dir = requireDir('./certificates');

module.exports = Object.values(dir);
