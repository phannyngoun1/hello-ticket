#!/usr/bin/env node

/**
 * Test JSX object literal protection
 */

// Simplified test of the renderTemplateContent logic from create-crud-unified.cjs

const template = `<CustomerProvider
  config={{
    apiClient: api,
    endpoints: {
      {{EntityNamePluralLower}}: "/api/v1/{{ParentRoute}}/{{EntityNamePluralLower}}",
    },
  }}
>`;

const context = {
  EntityNamePluralLower: 'customers',
  ParentRoute: 'sales',
};

console.log('Template:');
console.log(template);
console.log('\nContext:', context);

// Test the JSX protection regex
const jsxObjectRegex = /(\w+)=\{\{/g;
let match;
console.log('\nJSX Object Regex Matches:');
while ((match = jsxObjectRegex.exec(template)) !== null) {
  console.log(`  Found: "${match[0]}" at index ${match.index}`);
  console.log(`  Property name: "${match[1]}"`);
}

// The issue: when we have config={{...}} with placeholders inside,
// the outer {{ }} is JSX syntax (should be preserved)
// but the inner {{EntityNamePluralLower}} is a template placeholder (should be replaced)

console.log('\nExpected output:');
console.log(`<CustomerProvider
  config={{
    apiClient: api,
    endpoints: {
      customers: "/api/v1/sales/customers",
    },
  }}
>`);

console.log('\nActual output (from CLI):');
console.log(`<CustomerProvider
  config=
>`);

console.log('\n❌ PROBLEM: The JSX object literal {{...}} is being stripped!');
console.log('\nRoot cause: The protection logic needs to:');
console.log('1. Identify JSX patterns: prop={{');
console.log('2. Protect the OUTER {{ }} from being treated as template syntax');
console.log('3. Still process INNER placeholders like {{EntityNamePluralLower}}');
console.log('4. Restore the outer {{ }} after processing');

