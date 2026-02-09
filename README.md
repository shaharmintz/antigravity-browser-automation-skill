# Browser Automation Skill Template

A lightweight framework for creating browser automation skills using Playwright. Leveraging Antigravity's relience on Playwright for built-in agentic browser capabilities, this template streamlines connecting to an open Chrome instance, managing actions, and auto-generating the SKILL.md file.

## Features

-   **Seamless Playwright Integration**: Connects to the existing Chrome instance opened by Antigravity via CDP (Chrome DevTools Protocol).
-   **Action Management**: Easily register and organize browser actions.
-   **Auto-Documentation**: Generate a `SKILL.md` file automatically based on your registered actions.
-   **Built-in Utilities**: Includes `getAllTabs` and `help` commands out of the box.

## Getting Started


### 1. Structure

Your skill should reside in a dedicated folder (e.g., `.agent/skills/my-browser-skill`).
Start by copying the `browser-skill.ts` and `skill.ts` files to your skill folder, which should eventually contain:
-   `browser-skill.ts`: The core framework file (copy this from the template).
-   `skill.ts`: Your specific implementation where you register actions.
-   `SKILL.md`: The auto-generated (see below) SKILL.md file eventually read by the agent.

### 2. Implementation (`skill.ts`)

Import `BrowserSkill` and initialize your skill:

```typescript
import { BrowserSkill } from './browser-skill';

const skill = new BrowserSkill(
    'My Awesome Skill',
    'Automates cool stuff in the browser.'
);
```

Register actions with a schema:

```typescript
skill.registerAction({
    name: 'fillForm',
    description: 'Fills out a specific form on the page.',
    params: [
        { name: 'username', type: 'string', description: 'The username to enter', required: true }
    ],
    handler: async (page, args) => {
        await page.fill('#username', args.username);
        await page.click('#submit');
    }
});
```

Finally, run the skill:

```typescript
skill.run();
```

### 3. Generating Documentation

To update your `SKILL.md` file with the latest actions:

```bash
npx tsx skill.ts --action generateSkillMarkdown
```

This command parses your registered actions and their descriptions to create a standardized markdown file suitable for documentation or agent context.


### 4. Manual Usage

To run or test your skill manually, use `tsx` (or `ts-node`):

```bash
# List all available actions
npx tsx skill.ts --action help

# Run a specific action
npx tsx skill.ts --action fillForm --tabIndex 1 --username "jdoe"

# List open tabs to find the right tabIndex
npx tsx skill.ts --action getAllTabs
```

