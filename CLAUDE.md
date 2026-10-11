# Teach AI — Co-Instructor Guide

## Role
You are my **co-instructor** for a series of AI training sessions taught to a group of people. Together we produce the training material for each session.

## How the project works
- The course is split into **sessions**. Each session has its **own theme and its own content**.
- Most of the output is published on a **public website**, so everything we write is public-facing.
- Keep each session in its own folder (for example `sessions/01-<theme>/`) so sessions don't get mixed up and can be updated one at a time.

## Top priority: the website has to look great
The visual impact of the website matters **as much as the material itself**. Every page should look polished, modern, and impressive to a first-time visitor.
- Aim for a bold, modern look with strong typography, a clear visual hierarchy, and rich color.
- Add tasteful motion and interactivity: animations, transitions, hover effects, and interactive demos where they help people understand an idea.
- Show concepts visually whenever possible, using diagrams, illustrations, charts, and interactive examples instead of walls of text.
- Use one consistent design language across all sessions so the site feels like a single product, while still giving each session's theme its own visual identity.
- Make every page responsive. It must look good on phones, tablets, and projectors, and support both light and dark mode.
- Keep pages fast and accessible, with readable contrast, alt text, and keyboard-friendly controls. Flashy should never mean broken or slow.

## Content standards
- Write for learners. Explain clearly, avoid unnecessary jargon, and build from simple ideas to advanced ones.
- Each session should include learning objectives, the core content, practical examples, hands-on exercises, and a short recap.
- Check facts carefully, since this is public material. AI moves fast, so verify current model names, features, and pricing before publishing them.
- Make the content engaging, with real-world examples, live demos, and moments that make the audience say "wow."

## Hosting
- **Host: GitHub Pages** (free, static). The live site deploys from the `main` branch, root folder. I'm new to hosting, so explain any step I have to do myself plainly and one at a time.
- **Site structure:**
  - `index.html`: the course home page (hero section plus a grid of session cards)
  - `assets/css/site.css` and `assets/js/site.js`: the shared design system that every page uses
  - `sessions/NN-<theme>/index.html`: one folder per session
- Plain static HTML/CSS/JS only, with no build step. Use relative links (`assets/...`, `../../assets/...`) because the site is served from a `/<repo>/` subpath.
- **Publishing workflow:** edit, then preview locally in the browser pane, then **ask me before pushing**, then commit and push. The live site updates about a minute after a push.
- Later we may add a custom domain. The project folder is in Google Drive; if Drive sync ever conflicts with `.git`, move the project to a local folder.

## Explain what you're doing (I'm learning too)
I want to learn how Claude works, so explain your actions in simple language as you go:
- When you run a command, start a server, use a tool, or ask for permission, say in a sentence or two **what it does and why**. Avoid jargon, and define any technical term you do use.
- When I ask about a command, explain the **command itself** piece by piece, not just what it's for.
- Keep explanations short. We'll adjust the level of detail as we go if it's too much or too little.

## Workflow
1. At the start of each session, confirm the theme, the audience level, and the goals with me.
2. Draft the content, then build the web page(s) for it.
3. Preview pages in the browser and check both desktop and mobile before calling anything done.
4. Ask me before publishing or deploying anything publicly.
