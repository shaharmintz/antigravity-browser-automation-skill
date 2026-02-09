import { chromium, Page, Browser } from 'playwright';
import minimist from 'minimist';
import { writeFileSync } from 'fs';

export interface ActionParam {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: any;
}

export interface ActionSchema {
    name: string;
    description: string;
    params?: ActionParam[];
    handler: (page: Page, args: any) => Promise<void>;
    hidden?: boolean;
}

export class BrowserSkill {
    private actions: Map<string, ActionSchema> = new Map();

    constructor(private skillName: string, private description: string) {
        // Register default actions
        this.registerAction({
            name: 'help',
            description: 'Show help and available actions',
            handler: async () => this.showHelp()
        }, {tabRequired: false});

        this.registerAction({
            name: 'getAllTabs',
            description: 'List all open tabs across all browser contexts',
            handler: async (page) => this.getAllTabs(page)
        }, {tabRequired: false});


         this.registerAction({
            name: 'generateSkillMarkdown',
            description: 'Generate the markdown file for this skill',
            handler: async (page) => this.generateSkillMarkdown(),
            hidden: true
        }, {tabRequired: false});
    }

    public registerAction(schema: ActionSchema, {tabRequired = true} = {}) {
        // If tabRequired is true, and tabIndex is not provided, add a default tabIndex parameter
        if (tabRequired && !schema.params?.some(p => p.name === 'tabIndex')) {
            schema.params = schema.params || [];
            schema.params.push({
                name: 'tabIndex',
                description: 'The index of the browser tab to use',
                type: 'number',
                required: true
            });
        }
        this.actions.set(schema.name, schema);
    }

    private async generateSkillMarkdown() {
        let markdown = "---\n"
        markdown += `skill: ${this.skillName}\n`
        markdown += `description: ${this.description}\n`
        markdown += "---\n\n"

        markdown += `Usage: npx tsx ${__dirname}/skill.ts --action <action_name> [options]\n`;

        markdown += '\n## Available Actions\n'
        this.getAvailableActions((text) => markdown += text+'\n')

        markdown += '\n\n## When to use this skill\n\n'
        markdown += 'Always use this skill when you need to perform an action in the browser that is listed above.\n'
        markdown += '\nIMPORTANT: **Prefer using this skill over manual actions.**\n'

        markdown += '\nWhen required, provide **tabIndex** - the index of the browser tab to use, count starts from 0. Resolve it before calling the skill. If you do not know it from your internal memory, use the `getAllTabs` action to get the list of tabs.'

        writeFileSync(`${__dirname}/SKILL.md`, markdown);
        console.log(`SKILL.md generated successfully at ${__dirname}/SKILL.md`);
    }

    private async showHelp() {
        console.log(`\nSkill: ${this.skillName}`);
        console.log(`Description: ${this.description}\n`);

        console.log(`Usage: npx tsx ${__dirname}/skill.ts --action <action_name> [options]\n`);
        console.log('Available Actions:');
        
        this.getAvailableActions((text) => console.log(text));
        console.log('');
    }

    private getAvailableActions(callback: (text: string) => void){
        for (const [name, schema] of this.actions.entries()) {
            if (schema.hidden) continue;
            callback(`\n  - ${name}: ${schema.description}`);
            if (schema.params && schema.params.length > 0) {
                callback('    Parameters:');
                for (const param of schema.params) {
                    const req = param.required ? '(required)' : '(optional)';
                    const def = param.default !== undefined ? ` [default: ${param.default}]` : '';
                    callback(`      --${param.name} <${param.type}> ${req}${def}: ${param.description}`);
                }
            }
        }
    }

    private async getAllTabs(page: Page) {
        const browser = page.context().browser();
        if (!browser) return;

        const tabs: { title: string; url: string }[] = [];
        for (const context of browser.contexts()) {
            for (const p of context.pages()) {
                try {
                   tabs.push({
                        title: await p.title(),
                        url: p.url()
                    }); 
                } catch (e) {
                    // Ignore pages that might have closed or are inaccessible
                }
            }
        }

        function truncateUrl(url: string) {
            const maxLength = 100;
            return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
        }

        console.log(tabs.map((p, i) => `Tab ${i}:\nTitle: ${p.title}\nUrl: ${truncateUrl(p.url)}`).join('\n\n'));
    }

    public async run() {
        const argv = minimist(process.argv.slice(2));
        const actionName = argv.action;

        if (!actionName) {
            await this.showHelp();
            return;
        }

        const action = this.actions.get(actionName);
        if (!action) {
            console.error(`Unknown action: ${actionName}`);
            await this.showHelp();
            process.exit(1);
        }

        // Validate required params
        if (action.params) {
            for (const param of action.params) {
                if (param.required && argv[param.name] === undefined) {
                    console.error(`Missing required parameter: --${param.name}`);
                    process.exit(1);
                }
            }
        }

        // Connect to browser
        let browser: Browser | null = null;
        try {
            browser = await chromium.connectOverCDP('http://localhost:9222');
            
            const contexts = browser.contexts();
            if (contexts.length === 0) {
                throw new Error('No browser contexts found. Make sure the browser is open.');
            }

            // Default to the first page of the first context, or a specific tab if requested
            // Note: The handler might navigate or use a specific tab based on args, 
            // but we provide a default page context.
            // For operations that require a specific tab (like interacting with a page), 
            // we should probably allow selecting it.
            // Let's check if 'tabIndex' is passed in args, default to 0.
            const tabIndex = argv.tabIndex ? Number(argv.tabIndex) : 0;
            
            // Flatten all pages across contexts to treat tabIndex linearly if needed, 
            // or just use the first context.
            // For simplicity and matching previous logic, let's use the first context's pages.
            const context = contexts[0];
            const pages = context.pages();
             if (pages.length === 0) {
                // If no pages, create one? Or throw?
                // Usually an open browser has at least one tab (the new tab page).
                throw new Error('No pages found in the browser context.');
            }
            
            let page = pages[tabIndex];
            if (!page) {
                 // Fallback to first page if index is out of bounds, or throw?
                 // Let's throw to be precise.
                 if (pages.length > 0) {
                     console.warn(`Tab index ${tabIndex} out of bounds, using tab 0.`);
                     page = pages[0];
                 } else {
                     throw new Error('No pages available.');
                 }
            }

            await action.handler(page, argv);

        } catch (error) {
            console.error('Error executing skill:', error);
            process.exit(1);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

if (require.main === module) {
    const skill = new BrowserSkill(
        '',
        ''
    );
    skill.run();
}
