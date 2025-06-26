# Obsidian Pandoc Plugin

A powerful document export plugin for [Obsidian](https://obsidian.md) that leverages [Pandoc](https://pandoc.org/) to convert your notes to various formats.

## ✨ Features

### **Core Export Capabilities**
Export your Obsidian notes to:
- **Word Documents** (.docx)
- **PDF files** (.pdf)
- **ePub books** (.epub)
- **HTML websites** (.html)
- **PowerPoint presentations** (.pptx)
- **LaTeX documents** (.tex)
- And [many more formats](https://pandoc.org/)

### **🚀 Advanced Features**
- **Universal YAML CLI Control**: Control any Pandoc argument via frontmatter
- **Smart Path Resolution**: Automatically finds templates and files across your vault
- **Per-Document Configuration**: Fine-grained control without global settings
- **Space-Safe File Paths**: Handles file names with spaces automatically
- **Theme-Compatible**: Works seamlessly with light and dark Obsidian themes

This lets you **write presentations**, **draft books**, **make webpages**, and **write assignments** all in Markdown, with professional-grade formatting control, all without leaving Obsidian.

![Command Palette Screenshot](./command-palette.png)

> **Note**: This plugin is desktop-only and requires [Pandoc](https://pandoc.org/) to be installed on your system.

## 📦 Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Pandoc Plugin"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from the [releases page](../../releases)
2. Extract the files to `{VaultFolder}/.obsidian/plugins/obsidian-pandoc/`
3. Reload Obsidian and enable the plugin in Settings

**Prerequisites**: Install [Pandoc](https://pandoc.org/installing.html) on your system first.

For detailed installation instructions, see the [Installation Wiki](https://github.com/OliverBalfour/obsidian-pandoc/wiki/Installation).

## 🚀 Usage

1. Open the command palette (`Ctrl+P` / `Cmd+P`)
2. Search for "Pandoc"
3. Choose your desired export format
4. The exported file will be saved in the same folder as your note

### Example
If you export a file called `MyNote.md` as a Word Document, you'll find `MyNote.docx` in the same folder.

### Advanced YAML Frontmatter Control

Control Pandoc's behavior on a per-document basis using YAML frontmatter:

```yaml
---
# Standard metadata
title: "My Academic Paper"
author: "John Doe"
date: "2024-01-01"

# Pandoc CLI arguments with pandoc- prefix
pandoc-number-sections: true
pandoc-toc: true
pandoc-toc-depth: 3
pandoc-template: "academic-paper.tex"
pandoc-bibliography: "references.bib"
pandoc-csl: "apa.csl"
pandoc-css: "custom-styles.css"
---

# Your document content here...
```

**Smart Path Resolution**: Templates and files are automatically found in:
1. Same folder as your note
2. Vault root directory  
3. Common template folders (`templates/`, `pandoc/`, `assets/`, etc.)

**Universal Support**: Any Pandoc CLI argument works with the `pandoc-` prefix - boolean flags, file paths, options, and arrays.

## 📚 Documentation

- [Using Pandoc Templates](https://github.com/OliverBalfour/obsidian-pandoc/wiki/Pandoc-Templates)
- [Citations Support](https://github.com/OliverBalfour/obsidian-pandoc/wiki/Citations-(work-in-progress))
- [Combining Documents](https://github.com/OliverBalfour/obsidian-pandoc/wiki/Combining-Documents)
- [Troubleshooting Guide](https://github.com/OliverBalfour/obsidian-pandoc/wiki/Troubleshooting)

## 🛠 Development

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/obsidian-pandoc.git
cd obsidian-pandoc

# Install dependencies
npm install

# Start development build
npm run dev
```

### Building
```bash
# Build for production (includes TypeScript type checking)
npm run build

# Version management (bump version across manifest.json and versions.json)
npm run version

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

See [development.md](./development.md) for detailed development instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Attribution

This plugin is a maintained fork of the original [obsidian-pandoc](https://github.com/OliverBalfour/obsidian-pandoc) by [Oliver Balfour](https://github.com/OliverBalfour). The original work has been completely modernized and significantly enhanced with advanced features.

**Original Author**: Oliver Balfour  
**Original Repository**: https://github.com/OliverBalfour/obsidian-pandoc

### Modernization & Enhancements
This fork includes comprehensive modernization and advanced features:
- ✅ **Full Template Compliance**: Exceeds official Obsidian plugin template standards
- 🚀 **Universal YAML CLI Control**: Per-document Pandoc configuration via frontmatter  
- 🚀 **Smart Path Resolution**: Vault-wide template and file discovery
- 🔧 **Modern Tooling**: TypeScript type checking, automated version management, ESLint v9
- 🎨 **Theme Integration**: Dark/light theme compatible styling

## ⚠️ Beta Notice

This plugin is in beta. While it works well for most use cases, there may be minor formatting issues. Always proof-read your exported documents!
