#!/usr/bin/env node

import prompts from 'prompts';
import { downloadTemplate } from 'giget';
import consola from 'consola';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

async function main() {
    console.clear();
    consola.info('🚀 Welcome to the Nuxt 4 SaaS Starter Scaffolding Tool!\n');

    // 1. Ask for project name
    const response = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'Where should we create your new project?',
        initial: 'my-nuxt-saas'
    });

    if (!response.projectName) {
        consola.error('Project name is required!');
        process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), response.projectName);
    const projectName = path.basename(targetDir);

    // 2. Download Template
    // TODO: REPLACE "gh:lakhwindersingh/nuxt-starter" WITH YOUR ACTUAL REPO URL
    const templateSource = 'gh:bootssecurity/nuxt4-saas-starter';

    try {
        consola.start(`Downloading template to ${response.projectName}...`);

        await downloadTemplate(templateSource, {
            dir: targetDir,
            force: true
        });

        consola.success('Template downloaded successfully!');
    } catch (err) {
        consola.error('Failed to download template:', err);
        process.exit(1);
    }

    // 3. Setup .env
    try {
        const envExample = path.join(targetDir, '.env.example');
        const envTarget = path.join(targetDir, '.env');

        if (fs.existsSync(envExample)) {
            fs.copyFileSync(envExample, envTarget);
            consola.success('Created .env file from example');
        }
    } catch (err) {
        consola.warn('Could not create .env file automatically.');
    }

    // 4. Instructions
    consola.box(`
    🎉 Project ready! 

    Next steps:
    1. cd ${response.projectName}
    2. bun install  (or npm install)
    3. bun dev      (or npm run dev)

    Happy coding!
  `);
}

main().catch(console.error);
