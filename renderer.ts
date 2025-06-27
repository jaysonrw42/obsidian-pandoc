
/*
 * renderer.ts
 *
 * This module exposes a function that turns an Obsidian markdown string into
 * an HTML string with as many inconsistencies ironed out as possible
 *
 */

import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'yaml';
import { Base64 } from 'js-base64';

import { FileSystemAdapter, MarkdownRenderer, MarkdownView, Notice } from 'obsidian';

import PandocPlugin from './main';
import { PandocPluginSettings, fileExists } from './global';
import mathJaxFontCSS from './styles/mathjax-css';
import appCSS, { variables as appCSSVariables } from './styles/app-css';
import { validatePandocOption, isFlagOnlyOption, FILE_PATH_ARGUMENTS } from './pandoc-options';


// Note: parentFiles is for internal use (to prevent recursively embedded notes)
// inputFile must be an absolute file path
export default async function render (plugin: PandocPlugin, view: MarkdownView,
    inputFile: string, outputFormat: string, parentFiles: string[] = []):
    Promise<{ html: string, metadata: { [index: string]: string }, cliArgs: string[] }>
{
    // Use Obsidian's markdown renderer to render to a hidden <div>
    const markdown = view.data;
    const wrapper = document.createElement('div');
    wrapper.style.display = 'hidden';
    document.body.appendChild(wrapper);
    await MarkdownRenderer.renderMarkdown(markdown, wrapper, path.dirname(inputFile), view);

    // Post-process the HTML in-place
    await postProcessRenderedHTML(plugin, inputFile, wrapper, outputFormat,
        parentFiles, await mermaidCSS(plugin.settings, plugin.vaultBasePath()));
    let html = wrapper.innerHTML;
    document.body.removeChild(wrapper);

    // If it's a top level note, make the HTML a standalone document - inject CSS, a <title>, etc.
    const rawMetadata = getYAMLMetadata(markdown);
    const currentFileDir = path.dirname(inputFile);
    const vaultBasePath = plugin.vaultBasePath();
    const { cleanedMetadata, cliArgs } = await convertYamlToPandocArgs(rawMetadata, currentFileDir, vaultBasePath, plugin.settings.templateFolder);
    cleanedMetadata.title ??= fileBaseName(inputFile);
    
    if (parentFiles.length === 0) {
        html = await standaloneHTML(plugin.settings, html, cleanedMetadata.title, vaultBasePath);
    }

    return { html, metadata: cleanedMetadata, cliArgs };
}

// Takes any file path like '/home/oliver/zettelkasten/Obsidian.md' and
// takes the base name, in this case 'Obsidian'
function fileBaseName(file: string): string {
    return path.basename(file, path.extname(file));
}

function getYAMLMetadata(markdown: string) {
    markdown = markdown.trim();
    if (markdown.startsWith('---')) {
        const trailing = markdown.substring(3);
        const frontmatter = trailing.substring(0, trailing.indexOf('---')).trim();
        return YAML.parse(frontmatter);
    }
    return {};
}

// Smart path resolution: try multiple locations to find files
async function resolveFilePath(filePath: string, currentFileDir: string, vaultBasePath: string, customTemplateFolder?: string | null): Promise<string> {
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
    if (customTemplateFolder) {
        const customPath = path.isAbsolute(customTemplateFolder) 
            ? path.resolve(customTemplateFolder, filePath)
            : path.resolve(vaultBasePath, customTemplateFolder, filePath);
        if (await fileExists(customPath)) {
            return customPath;
        }
    }
    
    // Try common template directories in vault
    const commonDirs = ['templates', 'Templates', '_templates', 'pandoc', 'assets'];
    for (const dir of commonDirs) {
        const templatePath = path.resolve(vaultBasePath, dir, filePath);
        if (await fileExists(templatePath)) {
            return templatePath;
        }
    }
    
    // If not found anywhere, return the original path (let Pandoc handle the error)
    return filePath;
}

// FILE_PATH_ARGUMENTS is now imported from pandoc-options.ts

// Convert YAML frontmatter fields with 'pandoc-' prefix to CLI arguments
async function convertYamlToPandocArgs(
    metadata: { [key: string]: any }, 
    currentFileDir: string, 
    vaultBasePath: string,
    customTemplateFolder?: string | null
): Promise<{ 
    cleanedMetadata: { [key: string]: any }, 
    cliArgs: string[] 
}> {
    const cleanedMetadata: { [key: string]: any } = {};
    const cliArgs: string[] = [];
    
    for (const [key, value] of Object.entries(metadata)) {
        if (key.startsWith('pandoc-')) {
            // Extract CLI argument name (remove 'pandoc-' prefix)
            const argName = key.substring(7);
            
            // Validate the option and value
            const validation = validatePandocOption(argName, value);
            if (!validation.isValid) {
                new Notice(`Pandoc argument validation error: ${validation.error}`);
                console.error(`Pandoc validation error for ${key}:`, validation.error);
                continue; // Skip invalid options
            }
            
            if (value === false || value === null || value === undefined) {
                // Boolean false/null/undefined: skip
                continue;
            } else if (value === true) {
                // Boolean true: check if it's a flag-only option
                if (isFlagOnlyOption(argName, value)) {
                    cliArgs.push(`--${argName}`);
                } else {
                    // For non-flag-only boolean options, use --flag=true
                    cliArgs.push(`--${argName}=true`);
                }
            } else if (Array.isArray(value)) {
                // Array: multiple arguments with same flag
                for (const item of value) {
                    if (item !== null && item !== undefined) {
                        // Validate each array item
                        const itemValidation = validatePandocOption(argName, item);
                        if (!itemValidation.isValid) {
                            new Notice(`Pandoc argument validation error for ${key}[]: ${itemValidation.error}`);
                            console.error(`Pandoc validation error for ${key}[]:`, itemValidation.error);
                            continue;
                        }
                        
                        // Apply smart path resolution for file arguments
                        const resolvedValue = FILE_PATH_ARGUMENTS.has(argName) 
                            ? await resolveFilePath(String(item), currentFileDir, vaultBasePath, customTemplateFolder)
                            : item;
                        cliArgs.push(`--${argName}=${resolvedValue}`);
                    }
                }
            } else {
                // String/number: --flag=value
                // Apply smart path resolution for file arguments
                const resolvedValue = FILE_PATH_ARGUMENTS.has(argName) 
                    ? await resolveFilePath(String(value), currentFileDir, vaultBasePath, customTemplateFolder)
                    : value;
                cliArgs.push(`--${argName}=${resolvedValue}`);
            }
        } else {
            // Regular metadata field: keep for metadata file
            cleanedMetadata[key] = value;
        }
    }
    
    return { cleanedMetadata, cliArgs };
}

async function getCustomCSS(settings: PandocPluginSettings, vaultBasePath: string): Promise<string> {
    if (!settings.customCSSFile) return '';
    let file = settings.customCSSFile;
    let buffer: Buffer = null;
    
    // Try absolute path
    try {
        buffer = await fs.promises.readFile(file);
    } catch {
        // Try relative path
        try {
            buffer = await fs.promises.readFile(path.join(vaultBasePath, file));
        } catch(e2) {
            new Notice(`Failed to load custom Pandoc CSS file: ${settings.customCSSFile}. Please check the file path.`);
            console.error('Custom CSS file read error:', e2);
            return '';
        }
    }

    return buffer.toString();
}

async function getAppConfig(vaultBasePath: string): Promise<any> {
    try {
        const configData = await fs.promises.readFile(path.join(vaultBasePath, '.obsidian', 'config'));
        return JSON.parse(configData.toString());
    } catch (error) {
        console.error('Failed to read Obsidian config:', error);
        return {}; // Return empty config as fallback
    }
}

async function currentThemeIsLight(vaultBasePath: string, config: any = null): Promise<boolean> {
    try {
        if (!config) config = await getAppConfig(vaultBasePath);
        return config.theme !== 'obsidian';
    } catch {
        return true;
    }
}

async function mermaidCSS(settings: PandocPluginSettings, vaultBasePath: string): Promise<string> {
    // We always inject CSS into Mermaid diagrams, using light theme if the user has requested no CSS
    //   otherwise the diagrams look terrible. The output is a PNG either way
    let light = true;
    if (settings.injectAppCSS === 'dark') light = false;
    if (settings.injectAppCSS === 'current') {
        light = await currentThemeIsLight(vaultBasePath);
    }
    return appCSSVariables(light);
}

// Gets a small subset of app CSS and 3rd party theme CSS if desired
async function getThemeCSS(settings: PandocPluginSettings, vaultBasePath: string): Promise<string> {
    if (settings.injectAppCSS === 'none') return '';
    try {
        const config = await getAppConfig(vaultBasePath);
        let light = await currentThemeIsLight(vaultBasePath, config);
        if (settings.injectAppCSS === 'light') light = true;
        if (settings.injectAppCSS === 'dark') light = false;
        return appCSS(light);
    } catch {
        return '';
    }
}

async function getDesiredCSS(settings: PandocPluginSettings, html: string, vaultBasePath: string): Promise<string> {
    let css = await getThemeCSS(settings, vaultBasePath);
    if (settings.injectAppCSS !== 'none') {
        css += ' ' + Array.from(document.querySelectorAll('style'))
            .map(s => s.innerHTML).join(' ');
    }
    // Inject MathJax font CSS if needed (at this stage embedded notes are
    //  already embedded so doesn't duplicate CSS)
    if (html.indexOf('jax="CHTML"') !== -1)
        css += ' ' + mathJaxFontCSS;
    // Inject custom local CSS file if it exists
    css += await getCustomCSS(settings, vaultBasePath);
    return css;
}

async function standaloneHTML(settings: PandocPluginSettings, html: string, title: string, vaultBasePath: string): Promise<string> {
    // Wraps an HTML fragment in a proper document structure
    //  and injects the page's CSS
    const css = await getDesiredCSS(settings, html, vaultBasePath);

    return `<!doctype html>\n` +
        `<html>\n` +
        `    <head>\n` +
        `        <title>${title}</title>\n` +
        `        <meta charset='utf-8'/>\n` +
        `        <style>\n${css}\n</style>\n` +
        `    </head>\n` +
        `    <body>\n` +
        `${html}\n` +
        `    </body>\n` +
        `</html>`;
}

async function postProcessRenderedHTML(plugin: PandocPlugin, inputFile: string, wrapper: HTMLElement,
    outputFormat: string, parentFiles: string[] = [], css: string = '')
{
    const dirname = path.dirname(inputFile);
    const adapter = plugin.app.vault.adapter as FileSystemAdapter;
    const settings = plugin.settings;
    // Fix <span src="image.png">
    for (let span of Array.from(wrapper.querySelectorAll('span[src$=".png"], span[src$=".jpg"], span[src$=".gif"], span[src$=".jpeg"]'))) {
        span.innerHTML = '';
        span.outerHTML = span.outerHTML.replace(/span/g, 'img');
    }
    // Fix <span class='internal-embed' src='another_note_without_extension'>
    for (let span of Array.from(wrapper.querySelectorAll('span.internal-embed'))) {
        let src = span.getAttribute('src');
        if (src) {
            const subfolder = inputFile.substring(adapter.getBasePath().length);  // TODO: this is messy
            const file = plugin.app.metadataCache.getFirstLinkpathDest(src, subfolder);
            try {
                if (parentFiles.indexOf(file.path) !== -1) {
                    // We've got an infinite recursion on our hands
                    // We should replace the embed with a wikilink
                    // Then our link processing happens afterwards
                    span.outerHTML = `<a href="${file}">${span.innerHTML}</a>`;
                } else {
                    const markdown = await adapter.read(file.path);
                    const newParentFiles = [...parentFiles];
                    newParentFiles.push(inputFile);
                    // TODO: because of this cast, embedded notes won't be able to handle complex plugins (eg DataView)
                    const html = await render(plugin, { data: markdown } as MarkdownView, file.path, outputFormat, newParentFiles);
                    span.outerHTML = html.html;
                }
            } catch (e) {
                // Continue if it can't be loaded
                console.error("Pandoc plugin encountered an error trying to load an embedded note: " + e.toString());
            }
        }
    }
    // Fix <a href="app://obsidian.md/markdown_file_without_extension">
    const prefix = 'app://obsidian.md/';
    for (let a of Array.from(wrapper.querySelectorAll('a'))) {
        if (!a.href.startsWith(prefix)) continue;
        // This is now an internal link (wikilink)
        if (settings.linkStrippingBehaviour === 'link' || outputFormat === 'html') {
            let href = path.join(dirname, a.href.substring(prefix.length));
            if (settings.addExtensionsToInternalLinks.length && a.href.startsWith(prefix)) {
                if (path.extname(href) === '') {
                    const dir = path.dirname(href);
                    const base = path.basename(href);
                    // Be careful to turn [[note#heading]] into note.extension#heading not note#heading.extension
                    const hashIndex = base.indexOf('#');
                    if (hashIndex !== -1) {
                        href = path.join(dir, base.substring(0, hashIndex) + '.' + settings.addExtensionsToInternalLinks + base.substring(hashIndex));
                    } else {
                        href = path.join(dir, base + '.' + settings.addExtensionsToInternalLinks);
                    }
                }
            }
            a.href = href;
        } else if (settings.linkStrippingBehaviour === 'strip') {
            a.outerHTML = '';
        } else if (settings.linkStrippingBehaviour === 'text') {
            a.outerHTML = a.innerText;
        } else if (settings.linkStrippingBehaviour === 'unchanged') {
            a.outerHTML = '[[' + a.outerHTML + ']]';
        }
    }
    // Fix <img src="app://obsidian.md/image.png">
    // Note: this will throw errors when Obsidian tries to load images with a (now invalid) src
    // These errors can be safely ignored
    if (outputFormat !== 'html') {
        for (let img of Array.from(wrapper.querySelectorAll('img'))) {
            if (img.src.startsWith(prefix) && img.getAttribute('data-touched') !== 'true') {
                img.src = adapter.getFullPath(img.src.substring(prefix.length));
                img.setAttribute('data-touched', 'true');
            }
        }
    }
    // Remove YAML frontmatter from the output if desired
    if (!settings.displayYAMLFrontmatter) {
        Array.from(wrapper.querySelectorAll('.frontmatter, .frontmatter-container'))
            .forEach(el => wrapper.removeChild(el));
    }
    // Fix Mermaid.js diagrams
    for (let svg of Array.from(wrapper.querySelectorAll('svg'))) {
        // Insert the CSS variables as a CSS string (even if the user doesn't want CSS injected; Mermaid diagrams look terrible otherwise)
        // TODO: it injects light theme CSS, do we want this?
        let style: HTMLStyleElement = svg.querySelector('style') || svg.appendChild(document.createElement('style'));
        style.innerHTML += css;
        // Inject a marker (arrowhead) for Mermaid.js diagrams and use it at the end of paths
        svg.innerHTML += `"<marker id="mermaid_arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowheadPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker>"`;
        svg.innerHTML = svg.innerHTML.replace(/app:\/\/obsidian\.md\/index\.html#arrowhead\d*/g, "#mermaid_arrowhead");
        // If the output isn't HTML, replace the SVG with a PNG for compatibility
        if (outputFormat !== 'html') {
            const scale = settings.highDPIDiagrams ? 2 : 1;
            const png = await convertSVGToPNG(svg, scale);
            svg.parentNode.replaceChild(png, svg);
        }
    }
}

// This creates an unmounted <img> element with a transparent background PNG data URL as the src
// The scale parameter is used for high DPI renders (the <img> element size is the same,
//  but the underlying PNG is higher resolution)
function convertSVGToPNG(svg: SVGSVGElement, scale: number = 1): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(svg.width.baseVal.value * scale);
    canvas.height = Math.ceil(svg.height.baseVal.value * scale);
    const ctx = canvas.getContext('2d');
    var svgImg = new Image;
    svgImg.src = "data:image/svg+xml;base64," + Base64.encode(svg.outerHTML);
    return new Promise((resolve) => {
        svgImg.onload = () => {
            ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
            const pngData = canvas.toDataURL('png');
            const img = document.createElement('img');
            img.src = pngData;
            img.width = Math.ceil(svg.width.baseVal.value);
            img.height = Math.ceil(svg.height.baseVal.value);
            resolve(img);
        };
    });
}
