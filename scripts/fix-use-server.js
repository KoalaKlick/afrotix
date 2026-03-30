const require_ = require;
const fs = require_('fs');

const path = 'd:/goals/do/Afrotix/Afrotix/lib/actions/organization.ts';
let content = fs.readFileSync(path, 'utf8');

if (content.indexOf('"use server";') !== -1 && content.indexOf('"use server";') > content.indexOf('import')) {
    // move "use server"; to the very top
    content = content.replace(/"use server";/, '');
    content = '"use server";\n\n' + content.trimStart();
    fs.writeFileSync(path, content);
    console.log('Fixed "use server" location');
} else {
    console.log('No fix needed');
}
