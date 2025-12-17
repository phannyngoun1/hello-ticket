# @truths/sales

A comprehensive sales management package for your application.

## What is Sales Package?

The sales package provides pre-built, styled, and functional components for managing sales in your application.

## Features

- 🎨 **Beautiful Designs**: Built with Tailwind CSS and shadcn/ui
- 🔧 **Customizable**: Extensive props for customization
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built with accessibility in mind
- 🎯 **Type-Safe**: Full TypeScript support
- 🔄 **Real-time**: Supports real-time updates

## Installation

```bash
npm install @truths/sales
```

## Quick Start

```tsx
import { SalesComponent } from "@truths/sales";

// Use your components here
<SalesComponent />;
```

## Generating CRUD Modules

After creating your package, you can quickly generate CRUD modules for your features:

### Basic CRUD (Simple, UOM pattern)

```bash
npm run create-basic-crud -- <entity-name> --package sales
```

Example:

```bash
npm run create-basic-crud -- category --package sales
npm run create-basic-crud -- supplier --package sales --fields "name:string,code:string,email:string"
```

### Full CRUD (Advanced features)

```bash
npm run create-crud -- <entity-name> --package sales --fields "name:string,status:enum"
```

Example:

```bash
npm run create-crud -- product --package sales --fields "name:string,price:number,status:enum"
```

**Note:** Full CRUD includes advanced features like:

- Status actions (lock/unlock, activate/deactivate)
- Advanced filtering
- Detail views with tabs
- Comprehensive form validation
- Keyboard shortcuts

## Available Components

Add your components here

## API Integration

The sales package integrates with `@truths/api` for backend communication:

```tsx
import { useSales } from "@truths/sales";

// In your component
const { data, loading, error, refetch } = useSales();
```

## Component Registry

All components are automatically registered and can be accessed via the registry:

```tsx
import { getSalesComponent, getAllSalesComponents } from "@truths/sales";

// Get a specific component
const Component = getSalesComponent("component-id");

// Get all components
const allComponents = getAllSalesComponents();
```

## Customization

### Theming

Components inherit your application's theme:

```tsx
<SalesComponent className="custom-class" theme="dark" />
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT
