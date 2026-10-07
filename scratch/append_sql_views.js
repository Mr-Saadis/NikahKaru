const fs = require('fs');
let raw = fs.readFileSync('openapi.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

const typeMap = {
  'integer': 'integer',
  'bigint': 'bigint',
  'number': 'numeric',
  'string': 'text',
  'boolean': 'boolean',
  'text': 'text',
  'date': 'date',
  'timestamp with time zone': 'timestamptz',
  'timestamp without time zone': 'timestamp',
  'uuid': 'uuid'
};

function getSqlType(prop) {
  if (prop.format && typeMap[prop.format]) return typeMap[prop.format];
  if (prop.type && typeMap[prop.type]) return typeMap[prop.type];
  if (prop.type && prop.type.startsWith('public.')) return prop.type;
  if (prop.format && prop.format.startsWith('public.')) return prop.format;
  return 'text';
}

let out = '\n\n-- ============================================================\n-- NEW VIEWS (Added via DB modifications)\n-- ============================================================\n';

for (const view of ['v_current_matching_preferences', 'mv_matching_profiles']) {
  out += `\n-- Note: This is an automatically reverse-engineered schema for the view '${view}'.\n`;
  out += `CREATE OR REPLACE ${view.startsWith('mv_') ? 'MATERIALIZED VIEW' : 'VIEW'} public.${view} AS\nSELECT\n`;
  
  const props = data.definitions[view].properties;
  const cols = [];
  for (const [k, v] of Object.entries(props)) {
    cols.push(`    null::${getSqlType(v)} AS ${k}`);
  }
  
  out += cols.join(',\n');
  out += `\n;\n`;
}

fs.appendFileSync('NikaahKaro_Phase_1_Database_Schema_v2.sql', out);
console.log('Appended SQL view stubs to schema file');
