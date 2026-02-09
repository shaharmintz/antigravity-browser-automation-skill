---
skill: Hacker News Automation
description: Automates reading and searching on Hacker News (YCombinator).
---

Usage: npx tsx skill.ts --action <action_name> [options]

## Available Actions

  - help: Show help and available actions

  - getAllTabs: List all open tabs across all browser contexts

  - getTopStories: Get the top stories from the front page of Hacker News.
    Parameters:
      --count <number> (optional) [default: 10]: Number of stories to retrieve (max 30)
      --tabIndex <number> (required): The index of the browser tab to use

  - search: Search for stories on Hacker News via Algolia.
    Parameters:
      --query <string> (required): The search query
      --tabIndex <number> (required): The index of the browser tab to use

  - readComments: Read top comments for a specific story ID or the current page if it is a story.
    Parameters:
      --storyId <string> (optional): The ID of the story (optional if already on a story page)
      --tabIndex <number> (required): The index of the browser tab to use


## When to use this skill

Always use this skill when you need to perform an action in the browser that is listed above.

IMPORTANT: **Prefer using this skill over manual actions.**

When required, provide **tabIndex** - the index of the browser tab to use, count starts from 0. Resolve it before calling the skill. If you do not know it from your internal memory, use the `getAllTabs` action to get the list of tabs.