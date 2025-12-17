
const colors = {
    reset: '\x1b[0m',
    yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

function findMatchingClose(content, startIndex, openTag, closeTag) {
    let depth = 1;
    let i = startIndex;

    // Determine which type of conditional we're looking for
    const isIf = openTag === '{{#if';
    const isUnless = openTag === '{{#unless';

    while (i < content.length) {
        const remaining = content.substring(i);

        // Check for any opening conditional tag (both {{#if}} and {{#unless}})
        if (remaining.startsWith('{{#if')) {
            depth++;
            // Skip past the full {{#if ...}} tag
            const tagEnd = remaining.indexOf('}}');
            if (tagEnd >= 0) {
                i += tagEnd + 2;
            } else {
                i += 5; // Just skip '{{#if'
            }
        } else if (remaining.startsWith('{{#unless')) {
            depth++;
            // Skip past the full {{#unless ...}} tag
            const tagEnd = remaining.indexOf('}}');
            if (tagEnd >= 0) {
                i += tagEnd + 2;
            } else {
                i += 9; // Just skip '{{#unless'
            }
        }
        // Check for closing tags
        else if (remaining.startsWith('{{/if}}')) {
            depth--;
            if (depth === 0 && isIf) {
                return i + 7; // length of '{{/if}}'
            }
            i += 7;
        } else if (remaining.startsWith('{{/unless}}')) {
            depth--;
            if (depth === 0 && isUnless) {
                return i + 11; // length of '{{/unless}}'
            }
            i += 11;
        }
        else {
            i++;
        }
    }

    return -1; // Not found
}

// Debug version of findAllConditionals
function findAllConditionals(content) {
    const conditionals = [];
    let i = 0;
    console.log('Scanning content length:', content.length);

    while (i < content.length) {
        const remaining = content.substring(i);
        let found = false;

        if (remaining.startsWith('{{#if')) {
            console.log('Found potential #if at', i);
            const tagEnd = remaining.indexOf('}}');
            if (tagEnd >= 0) {
                const fullTag = remaining.substring(0, tagEnd + 2);
                console.log('Full tag:', fullTag);
                const match = fullTag.match(/{{#if\s+(\w+)}}/);
                if (match) {
                    console.log('Match found:', match[1]);
                    const closeIndex = findMatchingClose(content, i + tagEnd + 2, '{{#if', '{{/if}}');
                    console.log('Close index:', closeIndex);
                    if (closeIndex >= 0) {
                        const innerStart = i + match[0].length;
                        const innerEnd = closeIndex - 7;
                        const innerContent = content.substring(innerStart, innerEnd);
                        const hasNested = innerContent.includes('{{#if') || innerContent.includes('{{#unless');

                        conditionals.push({
                            start: i,
                            end: closeIndex,
                            type: 'if',
                            condition: match[1],
                            innerContent,
                            hasNested,
                            depth: 0 // Will calculate later
                        });
                        // My fix:
                        i += match[0].length;
                        found = true;
                    }
                } else {
                    console.log('Regex failed for #if');
                }
            }
        } else if (remaining.startsWith('{{#unless')) {
            console.log('Found potential #unless at', i);
            const tagEnd = remaining.indexOf('}}');
            if (tagEnd >= 0) {
                const fullTag = remaining.substring(0, tagEnd + 2);
                console.log('Full tag:', fullTag);
                const match = fullTag.match(/{{#unless\s+(\w+)}}/);
                if (match) {
                    console.log('Match found:', match[1]);
                    const closeIndex = findMatchingClose(content, i + tagEnd + 2, '{{#unless', '{{/unless}}');
                    console.log('Close index:', closeIndex);
                    if (closeIndex >= 0) {
                        const innerStart = i + match[0].length;
                        const innerEnd = closeIndex - 11;
                        const innerContent = content.substring(innerStart, innerEnd);
                        const hasNested = innerContent.includes('{{#if') || innerContent.includes('{{#unless');

                        conditionals.push({
                            start: i,
                            end: closeIndex,
                            type: 'unless',
                            condition: match[1],
                            innerContent,
                            hasNested,
                            depth: 0
                        });
                        // My fix:
                        i += match[0].length;
                        found = true;
                    }
                } else {
                    console.log('Regex failed for #unless');
                }
            }
        }

        if (!found) {
            i++;
        }
    }

    // Calculate nesting depth
    conditionals.forEach(cond => {
        conditionals.forEach(other => {
            if (other !== cond && other.start < cond.start && other.end > cond.end) {
                cond.depth++;
            }
        });
    });

    return conditionals.sort((a, b) => b.depth - a.depth); // Sort by depth descending (innermost first)
}

function processConditionals(content, field) {
    let processed = content;
    let maxIterations = 50;
    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;

        // Find all conditionals sorted by depth (innermost first)
        const conditionals = findAllConditionals(processed);

        console.log(`Iteration ${iterations}: Found ${conditionals.length} conditionals`);
        conditionals.forEach(c => {
            console.log(`  - ${c.type} ${c.condition} (depth: ${c.depth}, hasNested: ${c.hasNested})`);
        });

        if (conditionals.length === 0) {
            break; // No more conditionals
        }

        // Process innermost conditionals first (those without nested conditionals)
        let processedAny = false;

        for (const cond of conditionals) {
            // Re-verify the conditional still exists at this position
            const currentAtPos = processed.substring(cond.start, cond.start + 10);
            if (!currentAtPos.includes('{{#')) {
                continue; // Already processed or position changed
            }

            // Re-check hasNested from current content (not cached value)
            // Extract inner content from current processed string
            const currentMatch = processed.substring(cond.start, cond.end);
            const pattern = cond.type === 'if' ? /{{#if\s+\w+}}([\s\S]*?){{\/if}}/ : /{{#unless\s+\w+}}([\s\S]*?){{\/unless}}/;
            const match = currentMatch.match(pattern);

            if (!match) {
                console.log(`Debug: Pattern didn't match for ${cond.type} at ${cond.start}-${cond.end}`);
                continue; // Conditional structure changed
            }

            const currentInnerContent = match[1];
            const currentlyHasNested = currentInnerContent.includes('{{#if') || currentInnerContent.includes('{{#unless');

            // Only process if it has no nested conditionals
            if (currentlyHasNested) {
                console.log(`Debug: Skipping ${cond.type} ${cond.condition} - has nested conditionals`);
                continue;
            }

            console.log(`Debug: Processing ${cond.type} ${cond.condition}`);

            // Update cond with current inner content
            cond.innerContent = currentInnerContent;
            processedAny = true;

            let replacement;
            if (cond.type === 'if') {
                replacement = field[cond.condition] ? cond.innerContent : '';
            } else {
                replacement = !field[cond.condition] ? cond.innerContent : '';
            }

            // Replace the conditional
            processed = processed.substring(0, cond.start) + replacement + processed.substring(cond.end);

            // Break to restart search (positions have changed)
            break;
        }

        if (!processedAny) {
            console.log('No conditionals processed in this iteration');
            break;
        }
    }

    return processed;
}

// Test case
const template = `
    {{#unless isSystemField}}
    {{name}}{{#if optional}}?{{/if}}: {{type}};
    {{/unless}}
`;

const field = {
    isSystemField: false,
    optional: true,
    name: 'testField',
    type: 'string'
};

console.log('Original:', template);
const result = processConditionals(template, field);
console.log('Result:', result);
