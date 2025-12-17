const {
    colors,
    snakeCase,
    camelCase,
    capitalize
} = require('./utils');

// ============================================================================
// System Field Constants
// ============================================================================

/**
 * System-managed audit fields that are automatically handled by the backend
 * These fields should NOT be included in --fields parameter as they are:
 * - Automatically added to all entity response types
 * - Excluded from create/update input types
 * - Managed by the database/ORM layer
 */
const SYSTEM_AUDIT_FIELDS = ['created_at', 'updated_at', 'deactivated_at'];

/**
 * Other system fields that are standard across all entities
 * These are also excluded from --fields parameter
 */
const SYSTEM_STANDARD_FIELDS = ['id', 'tenant_id', 'version', 'is_active', 'code', 'name'];

/**
 * Combined list of all system fields
 */
const ALL_SYSTEM_FIELDS = [...SYSTEM_AUDIT_FIELDS, ...SYSTEM_STANDARD_FIELDS];

// Parse fields for Python backend
function parseFieldsForBackend(fields) {
    // Filter out system fields that are handled automatically
    // Note: 'code' and 'name' are hardcoded in templates, so filter them out too
    return fields
        .filter(f => !ALL_SYSTEM_FIELDS.includes(f.name))
        .map(field => {
            const fieldName = field.name;
            const fieldNameSnake = snakeCase(fieldName);
            const fieldType = field.type;

            // Map types to Python types
            let pythonType = 'str';
            let pythonOptionalType = 'Optional[str]';
            let pydanticType = 'str';
            let defaultValue = 'None';

            if (fieldType === 'number') {
                pythonType = 'float';
                pythonOptionalType = 'Optional[float]';
                pydanticType = 'float';
                defaultValue = 'None';
            } else if (fieldType === 'boolean') {
                pythonType = 'bool';
                pythonOptionalType = 'Optional[bool]';
                pydanticType = 'bool';
                defaultValue = 'False';
            } else if (fieldType === 'date') {
                pythonType = 'datetime';
                pythonOptionalType = 'Optional[datetime]';
                pydanticType = 'datetime';
                defaultValue = 'None';
            }

            return {
                name: fieldName,
                nameSnake: fieldNameSnake,
                nameCamel: camelCase(fieldName),
                type: pythonType,
                optionalType: pythonOptionalType,
                pydanticType: pydanticType,
                required: field.required,
                defaultValue: defaultValue,
                isString: fieldType === 'string',
                isNumber: fieldType === 'number',
                isBoolean: fieldType === 'boolean',
                isDate: fieldType === 'date',
            };
        });
}

/**
 * Parse field string from command line into field objects
 * Format: "name:type[:format][?],name2:type2..."
 * Examples:
 *   "sku:string,description:string,price:number:currency,stock_quantity:number"
 * 
 * Note: System fields (id, created_at, updated_at, etc.) should NOT be included
 * as they are automatically handled by templates
 */
function parseFieldString(fieldString) {
    if (!fieldString) {
        return [];
    }

    const fieldParts = fieldString.split(',').map(f => f.trim()).filter(Boolean);
    const fields = [];
    const systemFieldsDetected = [];

    // Fields to filter out (excluding code and name which are valid user fields)
    // code and name are hardcoded in basic-crud templates as defaults but can be user-specified
    const FIELDS_TO_FILTER = ['id', 'tenant_id', 'version', 'is_active', 'created_at', 'updated_at', 'deactivated_at'];

    for (const fieldPart of fieldParts) {
        const parts = fieldPart.split(':');
        let fieldNameRaw = parts[0].trim();

        // Check if field is optional (ends with ?)
        const isOptional = fieldNameRaw.endsWith('?');
        if (isOptional) {
            fieldNameRaw = fieldNameRaw.slice(0, -1);
        }

        const fieldName = fieldNameRaw;

        // Detect system fields and warn user (but allow code and name through)
        if (FIELDS_TO_FILTER.includes(fieldName)) {
            systemFieldsDetected.push(fieldName);
            // Skip adding system fields - they'll be handled by templates
            continue;
        }

        let fieldType = (parts[1] || 'string').trim();
        let format = null;

        // Check if there's a format specified (e.g., number:currency, date:datetime)
        if (parts.length > 2) {
            format = parts[2].trim();
        }

        // Handle optional marker on type (e.g., "field:date?")
        if (fieldType.endsWith('?')) {
            fieldType = fieldType.slice(0, -1).trim();
            // If not already marked as optional from field name, mark it now
            if (!isOptional) {
                // Note: We already have isOptional from field name, so no need to update
            }
        }

        fields.push({
            name: fieldName,
            type: fieldType,
            format: format,
            required: !isOptional
        });
    }

    // Show warning if system fields were detected
    if (systemFieldsDetected.length > 0) {
        console.log(`\n${colors.yellow}⚠ Warning: System fields detected and will be ignored:${colors.reset}`);
        systemFieldsDetected.forEach(field => {
            if (SYSTEM_AUDIT_FIELDS.includes(field)) {
                console.log(`  ${colors.dim}• ${field} (automatically added to all entities)${colors.reset}`);
            } else {
                console.log(`  ${colors.dim}• ${field} (managed by the system)${colors.reset}`);
            }
        });
        console.log(`${colors.dim}These fields are automatically included in the generated code.${colors.reset}\n`);
    }

    return fields;
}

module.exports = {
    SYSTEM_AUDIT_FIELDS,
    SYSTEM_STANDARD_FIELDS,
    ALL_SYSTEM_FIELDS,
    parseFieldsForBackend,
    parseFieldString
};
