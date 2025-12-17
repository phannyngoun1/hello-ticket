/**
 * {{EntityName}} Types
 */
export interface {{EntityName}} {
    id: string;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{type}};
    {{/unless}}
    {{/fields}}
    created_at: Date;
    updated_at?: Date;
}

export interface Create{{EntityName}}Input {
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{type}};
    {{/unless}}
    {{/fields}}
}

export interface Update{{EntityName}}Input {
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}?: {{type}};
    {{/unless}}
    {{/fields}}
}

