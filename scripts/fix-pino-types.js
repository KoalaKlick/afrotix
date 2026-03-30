const fs = require('fs');

const files = [
    'lib/dal/event.ts',
    'lib/dal/profile.ts',
    'lib/dal/promoter.ts',
    'lib/services/profile.ts',
    'lib/actions/organization.ts'
];

files.forEach(file => {
    try {
        const p = 'd:/goals/do/Afrotix/Afrotix/' + file;
        let content = fs.readFileSync(p, 'utf8');

        // Convert logger.error("msg", err) -> logger.error(err, "msg")
        content = content.replace(/logger\.error\((["`].*?["`]),\s*([^)]+)\)/g, 'logger.error($2, $1)');
        // Convert logger.info("msg", data) -> logger.info({ data: $2 }, $1)
        content = content.replace(/logger\.info\((["`].*?["`]),\s*([^)]+)\)/g, 'logger.info({ data: $2 }, $1)');

        fs.writeFileSync(p, content);
        console.log('Fixed types in ' + file);
    } catch (e) {
        console.error('Error on ' + file, e);
    }
});
