
/*
 * main.ts
 *
 * Initialises the plugin, adds command palette options, adds the settings UI
 * Markdown processing is done in renderer.ts and Pandoc invocation in pandoc.ts
 *
 */

import * as fs from 'fs';
import * as path from 'path';

import { Notice, Plugin, FileSystemAdapter, MarkdownView } from 'obsidian';
import { lookpath } from 'lookpath';
import { pandoc, inputExtensions, outputFormats, OutputFormat, needsLaTeX, needsPandoc } from './pandoc';
import * as YAML from 'yaml';
import * as temp from 'temp';

import render from './renderer';
import PandocPluginSettingTab from './settings';
import { PandocPluginSettings, DEFAULT_SETTINGS, replaceFileExtension, fileExists } from './global';
export default class PandocPlugin extends Plugin {
    settings!: PandocPluginSettings;
    features: { [key: string]: string | undefined } = {};
    private binaryMapInitialized = false;
    private everFoundPandoc = false;
    private cachedPandocPath: string | undefined;

    override async onload() {
        console.log('Loading Pandoc plugin');
        await this.loadSettings();

        // Check if Pandoc, LaTeX, etc. are installed and in the PATH
        await this.createBinaryMap();

        // Register all of the command palette entries
        this.registerCommands();

        this.addSettingTab(new PandocPluginSettingTab(this.app, this));
    }

    registerCommands() {
        for (let [prettyName, pandocFormat, extension, shortName] of outputFormats) {
            // All outputFormats entries have 4 elements, so these are guaranteed to exist
            const safeExtension = extension as string;
            const safeShortName = shortName as string;

            const name = 'Export as ' + prettyName;
            this.addCommand({
                id: 'pandoc-export-' + pandocFormat, name,
                checkCallback: (checking: boolean) => {
                    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (!activeView) return false;
                    if (!this.currentFileCanBeExported(pandocFormat as OutputFormat)) return false;
                    if (!checking) {
                        const currentFile = this.getCurrentFile();
                        if (currentFile) {
                            this.startPandocExport(currentFile, pandocFormat as OutputFormat, safeExtension, safeShortName);
                        }
                    }
                    return true;
                }
            });
        }
    }

    vaultBasePath(): string {
        return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
    }

    getCurrentFile(): string | null {
        const fileData = this.app.workspace.getActiveFile();
        if (!fileData) return null;
        const adapter = this.app.vault.adapter;
        if (adapter instanceof FileSystemAdapter)
            return adapter.getFullPath(fileData.path);
        return null;
    }

    currentFileCanBeExported(format: OutputFormat): boolean {
        // Is it a supported input type?
        const file = this.getCurrentFile();
        if (!file) {
            console.log('No current file for export check');
            return false;
        }
        
        let validInput = false;
        for (const ext of inputExtensions) {
            if (file.endsWith(ext)) {
                validInput = true;
                break;
            }
        }
        
        if (!validInput) {
            console.log('File type not supported for export:', file);
            return false;
        }
        
        // Aggressive debug logging
        console.log('Export availability check:', {
            format,
            file: file.substring(file.lastIndexOf('/') + 1), // Just filename for brevity
            binaryMapInitialized: this.binaryMapInitialized,
            pandocPath: this.features['pandoc'],
            everFoundPandoc: this.everFoundPandoc,
            needsPandoc: needsPandoc(format),
            needsLaTeX: needsLaTeX(format),
            pandocUndefined: this.features['pandoc'] === undefined,
            pandocNull: this.features['pandoc'] === null,
            pandocEmpty: this.features['pandoc'] === '',
            result: this.binaryMapInitialized ? 
                (needsPandoc(format) ? (this.features['pandoc'] || this.everFoundPandoc) : true) : 
                true
        });
        
        // ALWAYS show commands if we haven't initialized binary map yet
        if (!this.binaryMapInitialized) {
            console.log('Binary map not initialized, showing command');
            return true;
        }
        
        // ALWAYS show commands if we've ever found Pandoc (even if features got cleared)
        if (needsPandoc(format) && this.everFoundPandoc) {
            // Restore the cached path if features got cleared somehow
            if (!this.features['pandoc'] && this.cachedPandocPath) {
                console.log('Restoring cached Pandoc path:', this.cachedPandocPath);
                this.features['pandoc'] = this.cachedPandocPath;
            }
            console.log('Ever found Pandoc, showing command');
            return true;
        }
        
        // Check current binary availability
        if (needsPandoc(format) && !this.features['pandoc']) {
            console.log('Needs Pandoc but not found, hiding command');
            return false;
        }
        
        if (needsLaTeX(format) && !this.features['pdflatex']) {
            console.log('Needs LaTeX but not found, hiding command');
            return false;
        }
        
        console.log('All checks passed, showing command');
        return true;
    }

    async createBinaryMap() {
        // Only initialize once
        if (this.binaryMapInitialized) {
            console.log('Binary map already initialized, skipping re-initialization');
            return;
        }
        
        const pandocPath = this.settings.pandoc || await lookpath('pandoc');
        const pdflatexPath = this.settings.pdflatex || await lookpath('pdflatex');
        
        // Store the paths
        this.features['pandoc'] = pandocPath;
        this.features['pdflatex'] = pdflatexPath;
        this.binaryMapInitialized = true;
        
        // Remember if we ever found Pandoc - NEVER reset this
        if (pandocPath) {
            this.everFoundPandoc = true;
            this.cachedPandocPath = pandocPath;
            console.log('Found Pandoc at:', pandocPath);
        }
        
        // Debug logging
        console.log('Pandoc binary map initialized:', {
            pandoc: this.features['pandoc'],
            pdflatex: this.features['pdflatex'],
            everFoundPandoc: this.everFoundPandoc,
            settings: {
                pandoc: this.settings.pandoc,
                pdflatex: this.settings.pdflatex
            }
        });
    }

    async startPandocExport(inputFile: string, format: OutputFormat, extension: string, shortName: string) {
        console.log('Starting export - binary state before:', {
            pandoc: this.features['pandoc'],
            everFoundPandoc: this.everFoundPandoc,
            binaryMapInitialized: this.binaryMapInitialized
        });
        
        new Notice(`Exporting ${inputFile} to ${shortName}`);

        // Instead of using Pandoc to process the raw Markdown, we use Obsidian's
        // internal markdown renderer, and process the HTML it generates instead.
        // This allows us to more easily deal with Obsidian specific Markdown syntax.
        // However, we provide an option to use MD instead to use citations

        let outputFile: string = replaceFileExtension(inputFile, extension);
        if (this.settings.outputFolder) {
            outputFile = path.join(this.settings.outputFolder, path.basename(outputFile));
        }
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        
        try {
            let error, command;

            switch (this.settings.exportFrom) {
                case 'html': {
                    if (!view) {
                        new Notice('No active markdown view found');
                        return;
                    }
                    const { html, metadata, cliArgs } = await render(this, view, inputFile, format);

                    if (format === 'html') {
                        // Write to HTML file
                        await fs.promises.writeFile(outputFile, html);
                        new Notice('Successfully exported via Pandoc to ' + outputFile);
                        return;
                    } else {
                        // Spawn Pandoc
                        const metadataFile = temp.path();
                        const metadataString = YAML.stringify(metadata);
                        try {
                            await fs.promises.writeFile(metadataFile, metadataString);
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            new Notice(`Failed to create temporary metadata file: ${errorMessage}`);
                            console.error('Metadata file write error:', error);
                            return;
                        }
                        const result = await pandoc(
                            {
                                file: 'STDIN', contents: html, format: 'html', metadataFile,
                                pandoc: this.settings.pandoc || undefined, pdflatex: this.settings.pdflatex || undefined,
                                directory: path.dirname(inputFile),
                                documentArgs: cliArgs,
                            },
                            { file: outputFile, format },
                            this.settings.extraArguments.split('\n')
                        );
                        error = result.error;
                        command = result.command;
                    }
                    break;
                }
                case 'md': {
                    // For markdown export, we still need to extract YAML for CLI args
                    const markdownContent = view ? view.data : await fs.promises.readFile(inputFile, 'utf8');
                    const rawMetadata = this.getYAMLMetadata(markdownContent);
                    const currentFileDir = path.dirname(inputFile);
                    const vaultBasePath = this.vaultBasePath();
                    const { cliArgs } = await this.convertYamlToPandocArgs(rawMetadata, currentFileDir, vaultBasePath);
                    
                    const result = await pandoc(
                        {
                            file: inputFile, format: 'markdown',
                            pandoc: this.settings.pandoc || undefined, pdflatex: this.settings.pdflatex || undefined,
                            directory: path.dirname(inputFile),
                            documentArgs: cliArgs,
                        },
                        { file: outputFile, format },
                        this.settings.extraArguments.split('\n')
                    );
                    error = result.error;
                    command = result.command;
                    break;
                }
            }

            if (error.length) {
                new Notice('Exported via Pandoc to ' + outputFile + ' with warnings');
                new Notice('Pandoc warnings:' + error, 10000);
            } else {
                new Notice('Successfully exported via Pandoc to ' + outputFile);
            }
            if (this.settings.showCLICommands) {
                new Notice('Pandoc command: ' + command, 10000);
                console.log(command);
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            new Notice('Pandoc export failed: ' + errorMessage, 15000);
            console.error(e);
        }
        
        console.log('Export finished - binary state after:', {
            pandoc: this.features['pandoc'],
            everFoundPandoc: this.everFoundPandoc,
            binaryMapInitialized: this.binaryMapInitialized
        });
    }

    override onunload() {
        console.log('Unloading Pandoc plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // Helper method for extracting YAML metadata (duplicated from renderer.ts for markdown export)
    private getYAMLMetadata(markdown: string) {
        markdown = markdown.trim();
        if (markdown.startsWith('---')) {
            const trailing = markdown.substring(3);
            const frontmatter = trailing.substring(0, trailing.indexOf('---')).trim();
            return YAML.parse(frontmatter);
        }
        return {};
    }

    // Helper method for converting YAML to CLI args (duplicated from renderer.ts for markdown export)
    private async convertYamlToPandocArgs(
        metadata: { [key: string]: any }, 
        currentFileDir: string, 
        vaultBasePath: string
    ): Promise<{ 
        cleanedMetadata: { [key: string]: any }, 
        cliArgs: string[] 
    }> {
        const cleanedMetadata: { [key: string]: any } = {};
        const cliArgs: string[] = [];
        
        // Arguments that typically expect file paths (for smart resolution)
        const FILE_PATH_ARGUMENTS = new Set([
            'template', 'css', 'bibliography', 'csl', 'reference-doc', 'reference-odt', 
            'reference-docx', 'epub-cover-image', 'epub-stylesheet', 'include-in-header',
            'include-before-body', 'include-after-body', 'lua-filter', 'filter',
            'metadata-file', 'abbreviations', 'syntax-definition'
        ]);
        
        for (const [key, value] of Object.entries(metadata)) {
            if (key.startsWith('pandoc-')) {
                const argName = key.substring(7);
                
                if (value === true) {
                    cliArgs.push(`--${argName}`);
                } else if (value === false || value === null || value === undefined) {
                    continue;
                } else if (Array.isArray(value)) {
                    for (const item of value) {
                        if (item !== null && item !== undefined) {
                            // Apply smart path resolution for file arguments
                            const resolvedValue = FILE_PATH_ARGUMENTS.has(argName) 
                                ? await this.resolveFilePath(String(item), currentFileDir, vaultBasePath)
                                : item;
                            cliArgs.push(`--${argName}=${resolvedValue}`);
                        }
                    }
                } else {
                    // Apply smart path resolution for file arguments
                    const resolvedValue = FILE_PATH_ARGUMENTS.has(argName) 
                        ? await this.resolveFilePath(String(value), currentFileDir, vaultBasePath)
                        : value;
                    cliArgs.push(`--${argName}=${resolvedValue}`);
                }
            } else {
                cleanedMetadata[key] = value;
            }
        }
        
        return { cleanedMetadata, cliArgs };
    }

    // Helper method for smart path resolution (duplicated from renderer.ts for markdown export)
    private async resolveFilePath(filePath: string, currentFileDir: string, vaultBasePath: string): Promise<string> {
        // If it's already an absolute path, use as-is
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        
        // Try relative to current file directory
        const relativeToCurrent = path.resolve(currentFileDir, filePath);
        if (await fileExists(relativeToCurrent)) {
            return relativeToCurrent;
        }
        
        // Try relative to vault root
        const relativeToVault = path.resolve(vaultBasePath, filePath);
        if (await fileExists(relativeToVault)) {
            return relativeToVault;
        }
        
        // Try custom template folder first if specified
        if (this.settings.templateFolder) {
            const customPath = path.isAbsolute(this.settings.templateFolder) 
                ? path.resolve(this.settings.templateFolder, filePath)
                : path.resolve(vaultBasePath, this.settings.templateFolder, filePath);
            if (await fileExists(customPath)) {
                return customPath;
            }
        }
        
        // Try common template directories in vault
        const commonDirs = ['templates', 'Templates', '_templates', 'pandoc', '.pandoc', 'assets'];
        for (const dir of commonDirs) {
            const templatePath = path.resolve(vaultBasePath, dir, filePath);
            if (await fileExists(templatePath)) {
                return templatePath;
            }
        }
        
        // If not found anywhere, return the original path (let Pandoc handle the error)
        return filePath;
    }
}
