/*
 * pandoc-options.ts
 *
 * This module contains a comprehensive schema of Pandoc command-line options
 * with their types and validation rules to ensure proper argument formatting.
 */

export interface PandocOptionSchema {
    type: 'boolean' | 'string' | 'number' | 'choice' | 'file';
    description: string;
    flagOnly?: boolean; // If true, only use --flag, never --flag=value
    choices?: string[];
    allowMultiple?: boolean; // Can be specified multiple times
}

export const PANDOC_OPTIONS: Record<string, PandocOptionSchema> = {
    // Format options
    'from': { type: 'choice', description: 'Specify input format', choices: ['markdown', 'commonmark', 'docx', 'csv', 'html', 'json', 'latex', 'odt'] },
    'read': { type: 'choice', description: 'Specify input format (alias for from)', choices: ['markdown', 'commonmark', 'docx', 'csv', 'html', 'json', 'latex', 'odt'] },
    'to': { type: 'choice', description: 'Specify output format', choices: ['asciidoc', 'beamer', 'commonmark_x', 'docx', 'epub', 'html', 'pdf', 'json', 'latex', 'odt', 'pptx', 'revealjs', 'rtf', 'docuwiki', 'mediawiki'] },
    'write': { type: 'choice', description: 'Specify output format (alias for to)', choices: ['asciidoc', 'beamer', 'commonmark_x', 'docx', 'epub', 'html', 'pdf', 'json', 'latex', 'odt', 'pptx', 'revealjs', 'rtf', 'docuwiki', 'mediawiki'] },
    'output': { type: 'file', description: 'Write output to FILE' },

    // General options
    'data-dir': { type: 'file', description: 'Specify the user data directory' },
    'metadata': { type: 'string', description: 'Set the metadata field KEY to the value VAL', allowMultiple: true },
    'metadata-file': { type: 'file', description: 'Read metadata from YAML/JSON file', allowMultiple: true },
    'defaults': { type: 'file', description: 'Read default options from FILE' },
    'file-scope': { type: 'boolean', description: 'Parse each file individually before combining' },
    'sandbox': { type: 'boolean', description: 'Run pandoc in a sandbox' },
    'standalone': { type: 'boolean', description: 'Produce output with an appropriate header and footer' },
    'template': { type: 'file', description: 'Use FILE as a custom template' },
    'variable': { type: 'string', description: 'Set template variable KEY to VAL', allowMultiple: true },
    'variable-json': { type: 'string', description: 'Set template variable KEY to JSON value', allowMultiple: true },
    'wrap': { type: 'choice', description: 'Determine how text is wrapped', choices: ['auto', 'none', 'preserve'] },
    'ascii': { type: 'boolean', description: 'Use only ASCII characters in output' },

    // Table of contents
    'toc': { type: 'boolean', description: 'Include table of contents', flagOnly: true },
    'table-of-contents': { type: 'boolean', description: 'Include table of contents (alias for toc)', flagOnly: true },
    'toc-depth': { type: 'number', description: 'Specify the number of section levels to include in TOC' },

    // Lists
    'lof': { type: 'boolean', description: 'Include list of figures', flagOnly: true },
    'list-of-figures': { type: 'boolean', description: 'Include list of figures (alias for lof)', flagOnly: true },
    'lot': { type: 'boolean', description: 'Include list of tables', flagOnly: true },
    'list-of-tables': { type: 'boolean', description: 'Include list of tables (alias for lot)', flagOnly: true },

    // Numbering
    'number-sections': { type: 'boolean', description: 'Number section headings', flagOnly: true },
    'number-offset': { type: 'string', description: 'Offset for section numbering' },
    'top-level-division': { type: 'choice', description: 'Treat top-level headers as', choices: ['section', 'chapter', 'part'] },

    // File processing
    'extract-media': { type: 'file', description: 'Extract images and other media to directory' },
    'resource-path': { type: 'string', description: 'List of paths to search for images and other resources', allowMultiple: true },

    // Include files
    'include-in-header': { type: 'file', description: 'Include contents of FILE in header', allowMultiple: true },
    'include-before-body': { type: 'file', description: 'Include contents of FILE before body', allowMultiple: true },
    'include-after-body': { type: 'file', description: 'Include contents of FILE after body', allowMultiple: true },

    // Syntax highlighting
    'no-highlight': { type: 'boolean', description: 'Disable syntax highlighting', flagOnly: true },
    'highlight-style': { type: 'string', description: 'Specify the coloring style for highlighted source code' },
    'syntax-definition': { type: 'file', description: 'Load a KDE XML syntax definition file', allowMultiple: true },

    // Text processing
    'dpi': { type: 'number', description: 'Specify the default dpi for images' },
    'eol': { type: 'choice', description: 'Manually specify line endings', choices: ['crlf', 'lf', 'native'] },
    'columns': { type: 'number', description: 'Length of lines in characters' },
    'preserve-tabs': { type: 'boolean', description: 'Preserve tabs instead of converting to spaces' },
    'tab-stop': { type: 'number', description: 'Specify the number of spaces per tab' },

    // PDF options
    'pdf-engine': { type: 'choice', description: 'Use the specified engine when producing PDF output', choices: ['pdflatex', 'lualatex', 'xelatex', 'wkhtmltopdf', 'weasyprint', 'pagedjs-cli', 'prince', 'context', 'pdfroff'] },
    'pdf-engine-opt': { type: 'string', description: 'Give option to the PDF-engine', allowMultiple: true },

    // References and citations
    'reference-doc': { type: 'file', description: 'Use FILE as a style reference' },
    'self-contained': { type: 'boolean', description: 'Produce a standalone HTML file with no external dependencies' },
    'embed-resources': { type: 'boolean', description: 'Embed resources in the output file' },
    'link-images': { type: 'boolean', description: 'Link to images instead of embedding them' },
    'request-header': { type: 'string', description: 'Set request header when fetching remote files', allowMultiple: true },
    'no-check-certificate': { type: 'boolean', description: 'Disable SSL certificate verification' },

    // Bibliography and citations
    'citeproc': { type: 'boolean', description: 'Process citations with citeproc', flagOnly: true },
    'bibliography': { type: 'file', description: 'Set the bibliography field in metadata', allowMultiple: true },
    'csl': { type: 'file', description: 'Set the csl field in metadata' },
    'citation-abbreviations': { type: 'file', description: 'Set the citation-abbreviations field in metadata' },
    'natbib': { type: 'boolean', description: 'Use natbib for citations in LaTeX output', flagOnly: true },
    'biblatex': { type: 'boolean', description: 'Use BibLaTeX for citations in LaTeX output', flagOnly: true },

    // Math rendering
    'mathml': { type: 'boolean', description: 'Render TeX math using MathML', flagOnly: true },
    'webtex': { type: 'string', description: 'Render TeX math using the WebTeX service' },
    'mathjax': { type: 'string', description: 'Render TeX math using MathJax' },
    'katex': { type: 'string', description: 'Render TeX math using KaTeX' },
    'gladtex': { type: 'boolean', description: 'Render TeX math using GladTeX', flagOnly: true },

    // Processing options
    'abbreviations': { type: 'file', description: 'Specifies a custom abbreviations file' },
    'indented-code-classes': { type: 'string', description: 'Classes to use for indented code blocks' },
    'default-image-extension': { type: 'string', description: 'Specify a default extension to use when image paths/URLs have no extension' },
    'filter': { type: 'string', description: 'Specify an executable to be used as a filter', allowMultiple: true },
    'lua-filter': { type: 'file', description: 'Transform the document using pandoc-lua-filter', allowMultiple: true },
    'shift-heading-level-by': { type: 'number', description: 'Shift heading levels by a positive or negative integer' },
    'base-header-level': { type: 'number', description: 'Specify the base level for headers' },
    'track-changes': { type: 'choice', description: 'Specifies what to do with tracked changes', choices: ['accept', 'reject', 'all'] },
    'strip-comments': { type: 'boolean', description: 'Strip out HTML comments' },
    'reference-links': { type: 'boolean', description: 'Use reference-style links' },
    'reference-location': { type: 'choice', description: 'Specify where footnotes should be placed', choices: ['block', 'section', 'document'] },

    // HTML-specific options
    'css': { type: 'file', description: 'Link to a CSS style sheet', allowMultiple: true },
    'epub-subdirectory': { type: 'string', description: 'Specify subdirectory that will hold the EPUB' },
    'epub-cover-image': { type: 'file', description: 'Use the specified image as the EPUB cover' },
    'epub-title-page': { type: 'boolean', description: 'Add title page to EPUB' },
    'epub-metadata': { type: 'file', description: 'Look in the specified XML file for metadata for the EPUB' },
    'epub-embed-font': { type: 'file', description: 'Embed the specified font in the EPUB', allowMultiple: true },
    'split-level': { type: 'number', description: 'Specify the heading level at which to split the EPUB' },
    'chunk-template': { type: 'file', description: 'Path template for new chunks' },
    'epub-chapter-level': { type: 'number', description: 'Specify the heading level at which to split the EPUB into chapters' },
    'ipynb-output': { type: 'choice', description: 'Determine how jupyter notebook outputs are treated', choices: ['all', 'none', 'best'] },

    // Slides
    'slide-level': { type: 'number', description: 'Specifies that headers with the specified level create slides' },
    'section-divs': { type: 'boolean', description: 'Wrap sections in <section> tags' },
    'html-q-tags': { type: 'boolean', description: 'Use <q> tags for quotes in HTML' },
    'email-obfuscation': { type: 'choice', description: 'Specify a method for obfuscating mailto links', choices: ['none', 'javascript', 'references'] },
    'id-prefix': { type: 'string', description: 'Specify a prefix to be added to all identifiers' },
    'title-prefix': { type: 'string', description: 'Specify a prefix to be added to all CSS selectors' },

    // Reading options
    'listings': { type: 'boolean', description: 'Use the listings package for LaTeX code blocks' },
    'incremental': { type: 'boolean', description: 'Make list items in slide shows display incrementally' },

    // Document structure
    'figure-caption-position': { type: 'choice', description: 'Determines where figure captions are placed', choices: ['above', 'below'] },
    'table-caption-position': { type: 'choice', description: 'Determines where table captions are placed', choices: ['above', 'below'] },
    'markdown-headings': { type: 'choice', description: 'Specifies whether to use ATX or Setext-style headings', choices: ['setext', 'atx'] },
    'list-tables': { type: 'boolean', description: 'Render tables as list tables' },

    // Debugging and logging
    'trace': { type: 'boolean', description: 'Print debug information' },
    'dump-args': { type: 'boolean', description: 'Print information about command-line arguments' },
    'ignore-args': { type: 'boolean', description: 'Ignore command-line arguments' },
    'verbose': { type: 'boolean', description: 'Give verbose debugging output', flagOnly: true },
    'quiet': { type: 'boolean', description: 'Suppress warning messages', flagOnly: true },
    'fail-if-warnings': { type: 'boolean', description: 'Exit with error status if there are any warnings' },
    'log': { type: 'file', description: 'Write log messages in machine-readable JSON format to FILE' },

    // Version and help
    'version': { type: 'boolean', description: 'Print version', flagOnly: true },
    'help': { type: 'boolean', description: 'Show help', flagOnly: true },

    // Listing options (for information)
    'list-input-formats': { type: 'boolean', description: 'List supported input formats', flagOnly: true },
    'list-output-formats': { type: 'boolean', description: 'List supported output formats', flagOnly: true },
    'list-extensions': { type: 'string', description: 'List supported extensions for FORMAT' },
    'list-highlight-languages': { type: 'boolean', description: 'List supported languages for syntax highlighting', flagOnly: true },
    'list-highlight-styles': { type: 'boolean', description: 'List supported styles for syntax highlighting', flagOnly: true },
    'print-default-template': { type: 'string', description: 'Print the system default template for an output FORMAT' },
    'print-default-data-file': { type: 'file', description: 'Print a system default data file' },
    'print-highlight-style': { type: 'string', description: 'Print a JSON version of a highlighting style' },
    'bash-completion': { type: 'boolean', description: 'Generate a bash completion script', flagOnly: true }
};

// Arguments that are commonly used and expected to take file paths
export const FILE_PATH_ARGUMENTS = new Set([
    'template', 'css', 'bibliography', 'csl', 'reference-doc', 'reference-odt', 
    'reference-docx', 'epub-cover-image', 'epub-stylesheet', 'include-in-header',
    'include-before-body', 'include-after-body', 'lua-filter', 'filter',
    'metadata-file', 'abbreviations', 'syntax-definition', 'defaults',
    'data-dir', 'extract-media', 'output', 'epub-metadata', 'epub-embed-font',
    'chunk-template', 'citation-abbreviations', 'log', 'print-default-data-file'
]);

/**
 * Validates a pandoc option and its value
 * @param optionName The name of the option (without -- prefix)
 * @param value The value for the option
 * @returns An object with isValid boolean and error message if invalid
 */
export function validatePandocOption(optionName: string, value: any): { isValid: boolean; error?: string } {
    const schema = PANDOC_OPTIONS[optionName];
    
    if (!schema) {
        return { isValid: true }; // Allow unknown options for forward compatibility
    }

    // Handle boolean options
    if (schema.type === 'boolean') {
        if (schema.flagOnly && value !== true) {
            return { 
                isValid: false, 
                error: `Option '${optionName}' is flag-only and should be set to true, not '${value}'` 
            };
        }
        if (typeof value !== 'boolean') {
            return { 
                isValid: false, 
                error: `Option '${optionName}' expects a boolean value, got '${typeof value}'` 
            };
        }
        return { isValid: true };
    }

    // Handle choice options
    if (schema.type === 'choice' && schema.choices) {
        if (typeof value !== 'string' || !schema.choices.includes(value)) {
            return { 
                isValid: false, 
                error: `Option '${optionName}' must be one of: ${schema.choices.join(', ')}. Got '${value}'` 
            };
        }
        return { isValid: true };
    }

    // Handle number options
    if (schema.type === 'number') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
            return { 
                isValid: false, 
                error: `Option '${optionName}' expects a number, got '${value}'` 
            };
        }
        return { isValid: true };
    }

    // Handle string and file options
    if (schema.type === 'string' || schema.type === 'file') {
        if (typeof value !== 'string') {
            return { 
                isValid: false, 
                error: `Option '${optionName}' expects a string, got '${typeof value}'` 
            };
        }
        return { isValid: true };
    }

    return { isValid: true };
}

/**
 * Determines if an option should be formatted as a flag only (no value)
 * @param optionName The name of the option
 * @param value The value for the option
 * @returns true if this should be a flag-only argument
 */
export function isFlagOnlyOption(optionName: string, value: any): boolean {
    const schema = PANDOC_OPTIONS[optionName];
    return schema?.flagOnly === true && value === true;
}