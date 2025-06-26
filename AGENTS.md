# Agent Development Guide

## Build Commands
- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run release` - Create release using auto

## Project Structure
TypeScript Obsidian plugin using esbuild for bundling. Main entry: `main.ts`

## Code Style
- **Imports**: Use `import * as fs from 'fs'` for Node modules, destructured imports for Obsidian API
- **Types**: Explicit interfaces (see `PandocPluginSettings`), strict TypeScript with `noImplicitAny`
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Error Handling**: Use Obsidian's `Notice` class for user-facing errors
- **File Headers**: Include descriptive comments explaining file purpose
- **Async**: Use async/await pattern consistently
- **Settings**: Store configuration in plugin settings with defaults in `global.ts`

## Key Dependencies
- Obsidian API for plugin functionality
- Node.js modules (fs, path, child_process) for file operations
- External: lookpath, yaml, temp, js-base64

## Testing
No test framework configured - manual testing in Obsidian development environment