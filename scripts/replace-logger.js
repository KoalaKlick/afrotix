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
        const p = 'd:/goals/do/Sankofa/sankofa/' + file;
        let content = fs.readFileSync(p, 'utf8');

        if (!content.includes('logger')) {
            content = `import { logger } from '@/lib/logger';\n` + content;
        }

        content = content.replace(/console\.log/g, 'logger.info')
            .replace(/console\.error/g, 'logger.error');

        fs.writeFileSync(p, content);
        console.log('Updated ' + file);
    } catch (e) {
        console.error('Error on ' + file, e);
    }
});
