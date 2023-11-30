/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {join} from 'path';

export const paths = {
  credentials: join(process.cwd(), 'credentials'),
  implementations: join(process.cwd(), 'implementations')
};
