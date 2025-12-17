# @truths/purchasing

A comprehensive purchasing management package for your application.

## What is Purchasing Package?

The purchasing package provides pre-built, styled, and functional components for managing purchasing in your application.

## Features

- 🎨 **Beautiful Designs**: Built with Tailwind CSS and shadcn/ui
- 🔧 **Customizable**: Extensive props for customization
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built with accessibility in mind
- 🎯 **Type-Safe**: Full TypeScript support
- 🔄 **Real-time**: Supports real-time updates



## Installation

```bash
npm install @truths/purchasing
```

## Quick Start

```tsx
import { PurchasingComponent } from '@truths/purchasing';

// Use your components here
<PurchasingComponent />
```

## Generating CRUD Modules

After creating your package, you can quickly generate CRUD modules for your features:

### Basic CRUD (Simple, UOM pattern)

```bash
npm run create-basic-crud -- <entity-name> --package purchasing
```

Example:
```bash
npm run create-basic-crud -- category --package purchasing
npm run create-basic-crud -- supplier --package purchasing --fields "name:string,code:string,email:string"
```

### Full CRUD (Advanced features)

```bash
npm run create-crud -- <entity-name> --package purchasing --fields "name:string,status:enum"
```

Example:
```bash
npm run create-crud -- product --package purchasing --fields "name:string,price:number,status:enum"
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

The purchasing package integrates with `@truths/api` for backend communication:

```tsx
import { usePurchasing } from "@truths/purchasing";

// In your component
const { data, loading, error, refetch } = usePurchasing();
```

## Component Registry

All components are automatically registered and can be accessed via the registry:

```tsx
import { getPurchasingComponent, getAllPurchasingComponents } from "@truths/purchasing";

// Get a specific component
const Component = getPurchasingComponent("component-id");

// Get all components
const allComponents = getAllPurchasingComponents();
```

## Customization

### Theming

Components inherit your application's theme:

```tsx
<PurchasingComponent className="custom-class" theme="dark" />
```

## Examples

Check the `examples/` directory for complete examples.

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT
