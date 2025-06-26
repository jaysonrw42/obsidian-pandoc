# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Obsidian Pandoc Plugin - a desktop-only plugin for Obsidian that enables exporting notes to various formats (Word, PDF, ePub, HTML, PowerPoint, LaTeX) using Pandoc.

**Context**: This is a fork of a no-longer-maintained plugin that has been modernized to exceed the official Obsidian plugin template in many areas (see MODERNIZATION_ANALYSIS.md for details).

## Development Commands

```bash
npm run dev      # Development build with watch mode - keep running while developing
npm run build    # Production build (includes type checking)
npm run version  # Automated version management (updates manifest.json and versions.json)
npm run lint     # Run ESLint on TypeScript files
npm run lint:fix # Automatically fix linting issues
```

**Important**: The build script includes TypeScript type checking. The version script automates version bumping across manifest.json and versions.json files.

## Architecture & Key Files

The plugin follows Obsidian's plugin architecture with these core components:

- **main.ts**: Plugin entry point - initializes the plugin and registers commands
- **pandoc.ts**: Handles Pandoc process invocation and argument construction
- **renderer.ts**: Processes Markdown content before passing to Pandoc
- **settings.ts**: Manages the plugin settings UI and persistence
- **global.ts**: Contains default settings configuration

The plugin works by:
1. Taking the current note's content
2. Processing it through the renderer (handling Obsidian-specific syntax)
3. Passing it to Pandoc with user-configured arguments
4. Saving or opening the exported file

## Code Conventions

### Import Style
```typescript
// Node modules
import * as fs from 'fs';
import * as path from 'path';

// Obsidian API - use destructured imports
import { Plugin, Notice, MarkdownView } from 'obsidian';
```

### Error Handling
Use Obsidian's Notice class for user-facing errors:
```typescript
new Notice('Error: ' + error.message);
```

### TypeScript Configuration
- The project uses balanced strict mode (not fully strict)
- `noImplicitAny: true` is enforced
- Always explicitly type parameters and return types when not obvious

## Important Notes

- This is a **desktop-only** plugin (mobile not supported)
- No test framework is configured - test manually in Obsidian
- Settings are stored in the plugin's settings with defaults in `global.ts`
- The plugin requires Pandoc to be installed on the user's system
- LuaLaTeX is preferred over XeLaTeX for PDF exports (modern, actively maintained)
- File operations should always include proper error handling

## YAML Frontmatter CLI Arguments

The plugin supports per-document Pandoc CLI arguments via YAML frontmatter using the `pandoc-` prefix:

```yaml
---
# Standard metadata (passed to Pandoc as metadata)
title: "My Document"
author: "John Doe"
date: "2024-01-01"

# Pandoc CLI arguments (converted to --flags)
pandoc-number-sections: true
pandoc-toc: true
pandoc-toc-depth: 3
pandoc-css: "custom.css"
pandoc-bibliography: "refs.bib"
pandoc-csl: "apa.csl"
pandoc-template: "my template.tex"
---
```

### Conversion Rules
- `pandoc-flag: true` → `--flag`
- `pandoc-flag: false` → (omitted)
- `pandoc-option: "value"` → `--option=value`
- `pandoc-option: ["val1", "val2"]` → `--option=val1 --option=val2`

### Space Handling
File paths with spaces are properly handled without manual quoting:
```yaml
pandoc-css: "my file with spaces.css"  # Works correctly
```

### Smart Path Resolution
File path arguments automatically resolve from multiple locations:

1. **Relative to current file** (existing behavior)
2. **Relative to vault root** 
3. **Custom template folder** (if configured in settings)
4. **Common template directories**: `templates/`, `Templates/`, `_templates/`, `pandoc/`, `assets/`

```yaml
# All of these will automatically find the template:
pandoc-template: "mytemplate.tex"
# Searches: ./mytemplate.tex → {vault}/mytemplate.tex → {vault}/templates/mytemplate.tex → etc.

# Absolute paths work as-is:
pandoc-template: "/absolute/path/template.tex"
```

**Supported file arguments**: `template`, `css`, `bibliography`, `csl`, `reference-doc`, `reference-odt`, `reference-docx`, `epub-cover-image`, `epub-stylesheet`, `include-in-header`, `include-before-body`, `include-after-body`, `lua-filter`, `filter`, `metadata-file`, `abbreviations`, `syntax-definition`

### Template Folder Setting
Configure a custom template directory in plugin settings to enhance smart path resolution:

- **Setting**: Template folder (in plugin settings)
- **Examples**: `templates`, `pandoc`, `/absolute/path/to/templates`
- **Behavior**: Takes priority over common directories when resolving file paths
- **Supports**: Both relative paths (to vault root) and absolute paths

### Implementation Details
- `renderer.ts`: Extracts and converts `pandoc-*` fields to CLI arguments
- `pandoc.ts`: Fixed argument parsing to handle quoted values properly
- `main.ts`: Passes per-document CLI args to Pandoc alongside global settings

## Modernization Status

All modernization tasks are now complete:

### ✅ Template Compliance (Completed)
1. ✅ **Type checking in build** (#12) - COMPLETED
2. ✅ **Version management** (#13) - COMPLETED 
3. ✅ **Obsidian compatibility** (#14) - COMPLETED
4. ✅ **Editor configuration** (#15) - COMPLETED
5. ✅ **NPM configuration** (#16) - COMPLETED
6. ✅ **Template CSS structure** (#17) - COMPLETED
7. ✅ **Enhanced README** (#19) - COMPLETED

### 🚀 Advanced Features (Beyond Template)
1. ✅ **Universal YAML CLI Arguments** - Per-document Pandoc control via frontmatter
2. ✅ **Smart Path Resolution** - Automatic file finding across vault locations
3. ✅ **Template Folder Setting** - User-configurable template directory
4. ✅ **Argument Parsing Fix** - Proper handling of spaces in file paths
5. ✅ **Modern PDF Engine Defaults** - LuaLaTeX preferred over legacy XeLaTeX
6. ✅ **Command Stability Fixes** - Resolved disappearing command issues