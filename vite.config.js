import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Higher-order logic for determining the base deployment path
    // 1. Check for a dedicated environment variable (Universal solution)
    // 2. Fallback to GitHub Actions specific variables
    // 3. Default to root
    let base = process.env.VITE_BASE_URL || '/'

    if (base === '/' && process.env.GITHUB_REPOSITORY) {
        const [_, repo] = process.env.GITHUB_REPOSITORY.split('/')
        // If it's a primary GitHub Pages repo (e.g., user.github.io), base is '/'
        // Otherwise, it's a project page (e.g., user.github.io/repo/), base is '/repo/'
        base = repo.endsWith('.github.io') ? '/' : `/${repo}/`
    }

    return {
        base: base,
        plugins: [vue()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
    }
})
