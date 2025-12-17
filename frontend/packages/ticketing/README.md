# @truths/ticketing

A comprehensive ticketing management package for your application.

## What is Ticketing Package?

The ticketing package provides pre-built, styled, and functional components for managing ticketing in your application.

## Features

- 🎨 **Beautiful Designs**: Built with Tailwind CSS and shadcn/ui
- 🔧 **Customizable**: Extensive props for customization
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built with accessibility in mind
- 🎯 **Type-Safe**: Full TypeScript support
- 🔄 **Real-time**: Supports real-time updates



## Installation

```bash
npm install @truths/ticketing
```

## Quick Start

```tsx
import { TicketingComponent } from '@truths/ticketing';

// Use your components here
<TicketingComponent />
```

## Generating CRUD Modules

After creating your package, you can quickly generate CRUD modules for your features:

### Basic CRUD (Simple, UOM pattern)

```bash
npm run create-basic-crud -- <entity-name> --package ticketing
```

Example:
```bash
npm run create-basic-crud -- category --package ticketing
npm run create-basic-crud -- supplier --package ticketing --fields "name:string,code:string,email:string"
```

### Full CRUD (Advanced features)

```bash
npm run create-crud -- <entity-name> --package ticketing --fields "name:string,status:enum"
```

Example:
```bash
npm run create-crud -- product --package ticketing --fields "name:string,price:number,status:enum"
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

The ticketing package integrates with `@truths/api` for backend communication:

```tsx
import { useTicketing } from "@truths/ticketing";

// In your component
const { data, loading, error, refetch } = useTicketing();
```

## Component Registry

All components are automatically registered and can be accessed via the registry:

```tsx
import { getTicketingComponent, getAllTicketingComponents } from "@truths/ticketing";

// Get a specific component
const Component = getTicketingComponent("component-id");

// Get all components
const allComponents = getAllTicketingComponents();
```

## Customization

### Theming

Components inherit your application's theme:

```tsx
<TicketingComponent className="custom-class" theme="dark" />
```

## Examples

Check the `examples/` directory for complete examples.

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT
