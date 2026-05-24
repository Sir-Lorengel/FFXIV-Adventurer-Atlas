#!/usr/bin/env node
// build.js — Converts ffxiv-data.json → data.js
// Usage: node build.js
'use strict';

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'ffxiv-data.json');
const DEST = path.join(__dirname, 'data.js');

const raw  = fs.readFileSync(SRC, 'utf8');
const data = JSON.parse(raw);

const output = `// AUTO-GENERATED — do not edit by hand. Run: node build.js
// Source: ffxiv-data.json
'use strict';
const FFXIV_DATA = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(DEST, output, 'utf8');
console.log(`✓ data.js written (${(Buffer.byteLength(output) / 1024).toFixed(1)} KB)`);
