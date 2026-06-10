const fs = require('fs');
const docPath = 'C:/Users/user/.gemini/antigravity-ide/brain/2168196f-f432-4a47-b572-5cff8b6e0888/API_DOCUMENTATION_V1_UPDATED.md';
const doc = fs.readFileSync(docPath, 'utf8')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

const jsxPath = 'resources/js/Pages/Settings/System/ApiKey/Index.jsx';
let jsx = fs.readFileSync(jsxPath, 'utf8');

// Replace the content between {`# Dokumentasi API SIAP Alwan (v1) and `}
jsx = jsx.replace(/\{`# Dokumentasi API SIAP Alwan \(v1\)[\s\S]*?`\}/, '{`' + doc + '`}');

fs.writeFileSync(jsxPath, jsx);
console.log("Successfully updated Index.jsx");
