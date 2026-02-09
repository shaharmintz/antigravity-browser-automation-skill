import { BrowserSkill } from '../../browser-skill';

const skill = new BrowserSkill(
    'Hacker News Automation',
    'Automates reading and searching on Hacker News (YCombinator).'
);

skill.registerAction({
    name: 'getTopStories',
    description: 'Get the top stories from the front page of Hacker News.',
    params: [
        { name: 'count', type: 'number', description: 'Number of stories to retrieve (max 30)', default: 10 }
    ],
    handler: async (page, args) => {
        const count = Math.min(args.count || 10, 30);
        await page.goto('https://news.ycombinator.com/');
        
        // Wait for the rows to load
        await page.waitForSelector('.athing');

        const stories = await page.$$eval('.athing', (rows, count) => {
            return rows.slice(0, count).map(row => {
                const rank = row.querySelector('.rank')?.textContent?.replace('.', '') || '';
                const titleElement = row.querySelector('.titleline > a');
                const title = titleElement?.textContent || '';
                const url = titleElement?.getAttribute('href') || '';
                const id = row.getAttribute('id');
                
                // The subtext for points/comments is in the next row
                const subtextRow = row.nextElementSibling;
                const score = subtextRow?.querySelector('.score')?.textContent || '0 points';
                const user = subtextRow?.querySelector('.hnuser')?.textContent || 'unknown';
                const age = subtextRow?.querySelector('.age')?.textContent || '';
                
                return { rank, title, url, score, user, age, id };
            });
        }, count);

        console.log(JSON.stringify(stories, null, 2));
    }
});

skill.registerAction({
    name: 'search',
    description: 'Search for stories on Hacker News via Algolia.',
    params: [
        { name: 'query', type: 'string', description: 'The search query', required: true }
    ],
    handler: async (page, args) => {
        await page.goto(`https://hn.algolia.com/?q=${encodeURIComponent(args.query)}`);
        
        // Wait for results
        await page.waitForSelector('.Story_title');

        const results = await page.$$eval('.Story', (items) => {
            return items.slice(0, 5).map(item => {
                const title = item.querySelector('.Story_title')?.textContent || '';
                const meta = item.querySelector('.Story_meta')?.textContent || '';
                const link = item.querySelector('.Story_title > a')?.getAttribute('href') || '';
                return { title, meta, link };
            });
        });

        console.log(`Top 5 results for "${args.query}":`);
        console.log(JSON.stringify(results, null, 2));
    }
});

skill.registerAction({
    name: 'readComments',
    description: 'Read top comments for a specific story ID or the current page if it is a story.',
    params: [
        { name: 'storyId', type: 'string', description: 'The ID of the story (optional if already on a story page)' }
    ],
    handler: async (page, args) => {
        if (args.storyId) {
            await page.goto(`https://news.ycombinator.com/item?id=${args.storyId}`);
        } else if (!page.url().includes('item?id=')) {
            console.error('Error: Please provide a storyId or navigate to a story page first.');
            return;
        }

        // Wait for comments
        await page.waitForSelector('.commtext');

        const comments = await page.$$eval('.comtr', (rows) => {
            return rows.slice(0, 5).map(row => {
                const user = row.querySelector('.hnuser')?.textContent || 'unknown';
                const text = row.querySelector('.commtext')?.textContent?.replace(/\s+/g, ' ').trim().substring(0, 200) + '...' || '';
                const indent = row.querySelector('.ind')?.getAttribute('width') || '0';
                return { user, text, indent: parseInt(indent) / 40 }; 
            });
        });

        console.log('Top comments:');
        comments.forEach(c => {
            const indent = '  '.repeat(c.indent);
            console.log(`${indent}${c.user}: ${c.text}`);
        });
    }
});

skill.run();
