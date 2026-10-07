const fs = require('fs');
let raw = fs.readFileSync('openapi.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);

const typeMap = {
  'integer': 'number',
  'bigint': 'number',
  'number': 'number',
  'string': 'string',
  'boolean': 'boolean',
  'text': 'string',
  'date': 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'uuid': 'string'
};

function getTsType(prop) {
  if (prop.type === 'array') return getTsType(prop.items) + '[]';
  if (prop.type && typeMap[prop.type]) return typeMap[prop.type];
  if (prop.format && typeMap[prop.format]) return typeMap[prop.format];
  if (prop.type === 'string') return 'string';
  
  const parsePublic = (str) => {
    if (str && str.startsWith('public.')) {
      return str.split('.')[1].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }
    return null;
  };
  
  let t = parsePublic(prop.type) || parsePublic(prop.format);
  if (t) return t;
  
  return 'any';
}

let out = '\n// ============================================================\n// 9. VIEWS\n// ============================================================\n\n';

for (const view of ['mv_matching_profiles', 'v_current_matching_preferences']) {
  const interfaceName = view.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  out += `export interface ${interfaceName} {\n`;
  const props = data.definitions[view].properties;
  for (const [k, v] of Object.entries(props)) {
    let tsType = getTsType(v);
    if (tsType === 'ReligiousPractice') tsType = 'ReligiousPracticeLevel';
    if (tsType === 'YesNo') tsType = 'YesNo'; // exists
    out += `  ${k}: ${tsType} | null;\n`;
  }
  out += '}\n\n';
}

fs.appendFileSync('src/lib/types/database.types.ts', out);
console.log('Appended views to database.types.ts');
