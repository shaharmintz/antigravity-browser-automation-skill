import { BrowserSkill } from './browser-skill'; /* IN SKILL FOLDER THIS SHOULD CHANGE TO ./browser-skill */

/**
 * THIS IS JUST AN EXAMPLE OF HOW TO USE THE BROWSER SKILL
 * IT IS NOT MEANT TO BE USED IN PRODUCTION
 */


const skill = new BrowserSkill(
    'Linkedin Automation',
    'Automates tasks on LinkedIn using a connected browser instance.'
);

skill.registerAction({
    name: 'showAllExperiences',
    description: 'Expands the "See all positions" or "See all experiences" section on a LinkedIn profile.',
    handler: async (page) => {
        const locator1 = page.locator("#navigation-index-see-all-positions-aggregated");
        const locator2 = page.locator("#navigation-index-see-all-experiences");
        await locator1.or(locator2).click();
    }
});

skill.registerAction({
    name: 'showAllEducations',
    description: 'Expands the "See all education" section on a LinkedIn profile.',
    handler: async (page) => {
        await page.click("#navigation-index-see-all-education");
    }
});

skill.registerAction({
    name: 'connect',
    description: 'Clicks the Connect button and optionally adds a personalized note.',
    params: [
        { name: 'note', type: 'string', description: 'Personalized note for the connection request' }
    ],
    handler: async (page, args) => {
        await page.getByRole("button", { name: "Connect" }).first().click();
        if (args.note) {
            await page.getByRole("button", { name: "Add a note" }).click();
            await page.locator('#custom-message').pressSequentially(args.note, { 
                delay: Math.floor(Math.random() * (500 - 150 + 1)) + 150 
            });
        }
        await page.getByRole("button", { name: "Send" }).click();
    }
});

skill.registerAction({
    name: 'backToMainProfile',
    description: 'Clicks the back button to return to the main profile page from a sub-section.',
    handler: async (page) => {
        await page.click("button[aria-label='Back to the main profile page']");
    }
});


skill.run();
