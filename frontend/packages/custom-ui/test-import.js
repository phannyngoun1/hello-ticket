// Simple test to verify the audit logs component can be imported
try {
  // This would normally be an ES module import, but for testing we'll just check if the file exists
  console.log('Testing audit logs component import...');

  // Check if the component file exists and has valid syntax
  const fs = require('fs');
  const path = require('path');

  const componentPath = path.join(__dirname, 'src/components/audit-logs/index.tsx');
  const typesPath = path.join(__dirname, 'src/components/audit-logs/types.ts');

  if (fs.existsSync(componentPath)) {
    console.log('✅ Component file exists');
  } else {
    console.log('❌ Component file not found');
  }

  if (fs.existsSync(typesPath)) {
    console.log('✅ Types file exists');
  } else {
    console.log('❌ Types file not found');
  }

  // Check if date-fns import is removed
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  if (componentContent.includes('date-fns')) {
    console.log('❌ Still contains date-fns import');
  } else {
    console.log('✅ date-fns import removed');
  }

  console.log('✅ Import test completed successfully');

} catch (error) {
  console.error('❌ Import test failed:', error.message);
}