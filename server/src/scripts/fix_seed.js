const fs = require('fs');
const file = 'c:/Users/aakas/Desktop/CampusHire/server/src/scripts/seed.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("role: 'student',", "role: 'student',\n        collegeId: `COLLEGE${i}`,");
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed seed.js');
