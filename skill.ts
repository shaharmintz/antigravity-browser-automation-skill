import { BrowserSkill } from './browser-skill';

const skill = new BrowserSkill(
    '<Your skill name>',
    '<Skill description>'
);

// Register skills here

skill.registerAction({
    name: '<action name>',
    description: '<action description>',
    handler: async (page) => {
        // handler logic
    }
});

skill.registerAction({
    name: '<action name>',
    description: '<action description>',
    params: [
        { name: '<param name>', type: 'string' /* 'string' | 'number' | 'boolean' */, description: '<param description>' }
    ],
    handler: async (page, args) => {
        // handler logic
    }
});

skill.run();
