---
title: "Test Document"
author: "Test Author"

# Flag-only options (should work correctly now)
pandoc-citeproc: true
pandoc-toc: true  
pandoc-number-sections: true

# Options with values
pandoc-pdf-engine: "lualatex"
pandoc-toc-depth: 3
pandoc-template: "mytemplate.tex"

# File path options (will use smart resolution)
pandoc-css: "custom.css"
pandoc-bibliography: "refs.bib"

# Invalid options (should show validation errors)
pandoc-pdf-engine: "invalid-engine"  # Should fail - not a valid choice
pandoc-toc-depth: "not-a-number"     # Should fail - not a number
pandoc-citeproc: "true"               # Should fail - should be boolean true, not string
---

# Test Document

This document tests the new Pandoc argument validation system.

The validation system should:
1. Handle flag-only options correctly (like `--citeproc`, not `--citeproc=true`)
2. Validate option values against allowed choices
3. Check data types (numbers, booleans, strings)
4. Apply smart path resolution for file arguments
5. Show helpful error messages for invalid options