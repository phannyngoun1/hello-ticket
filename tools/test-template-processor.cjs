#!/usr/bin/env node

/**
 * Test script to verify template processor fix
 * Tests that placeholders are replaced correctly without skipping characters
 */

// Extract the template processing functions from create-crud-unified.cjs
// We'll test them in isolation

function getValueFromContext(context, key) {
  if (!key) return undefined;
  if (key === '.' || key === 'this') return context;
  const parts = key.split('.');
  let current = context;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function processTemplateInternal(template, context, skipJSXProps) {
  if (!template) return '';

  let result = '';
  let index = 0;

  while (index < template.length) {
    const start = template.indexOf('{{', index);
    if (start === -1) {
      result += template.slice(index);
      break;
    }

    result += template.slice(index, start);
    
    // Find matching closing }}
    let braceCount = 1;
    let pos = start + 2;
    let end = -1;
    
    while (pos < template.length && braceCount > 0) {
      if (template[pos] === '{' && template[pos + 1] === '{') {
        braceCount++;
        pos += 2;
      } else if (template[pos] === '}' && template[pos + 1] === '}') {
        braceCount--;
        if (braceCount === 0) {
          end = pos + 2;  // Points to position AFTER }}
        } else {
          pos += 2;
        }
      } else {
        pos++;
      }
    }
    
    if (end === -1) {
      result += template.slice(start);
      break;
    }

    const rawTag = template.slice(start + 2, end - 2);
    let tag = rawTag.trim();

    if (!tag) {
      result += '{{';
      index = end;
      continue;
    }

    const value = getValueFromContext(context, tag);
    const renderedValue = value === undefined || value === null ? '' : `${value}`;
    result += renderedValue;
    index = end;  // FIXED: was 'end + 2' which caused corruption
  }

  return result;
}

// Test cases
const tests = [
  {
    name: 'Module name in import statement',
    template: 'from app.application.{{ModuleName}}.commands import',
    context: { ModuleName: 'sales' },
    expected: 'from app.application.sales.commands import'
  },
  {
    name: 'Entity name followed by class name',
    template: '{{EntityName}}Repository',
    context: { EntityName: 'Customer' },
    expected: 'CustomerRepository'
  },
  {
    name: 'Variable name with underscore',
    template: 'self._{{EntityNameLower}}_repository',
    context: { EntityNameLower: 'customer' },
    expected: 'self._customer_repository'
  },
  {
    name: 'Multiple placeholders',
    template: 'class {{EntityName}}{{Suffix}}:',
    context: { EntityName: 'Customer', Suffix: 'Service' },
    expected: 'class CustomerService:'
  },
  {
    name: 'Placeholder followed by parenthesis',
    template: 'function transform{{EntityName}}(dto',
    context: { EntityName: 'Customer' },
    expected: 'function transformCustomer(dto'
  },
  {
    name: 'Placeholder in quotes',
    template: '"{{EntityNamePluralLower}}": string',
    context: { EntityNamePluralLower: 'customers' },
    expected: '"customers": string'
  },
  {
    name: 'Placeholder at end of template',
    template: 'export class {{EntityName}}',
    context: { EntityName: 'Customer' },
    expected: 'export class Customer'
  },
];

// Run tests
console.log('Testing template processor fix...\n');
let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = processTemplateInternal(test.template, test.context, false);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✅ PASS: ${test.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Template: ${test.template}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got:      ${result}`);
    console.log();
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✨ All tests passed! Template processor fix is working correctly.\n');

