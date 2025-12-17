# Hello Ticket - Frontend

Modern React frontend built with TypeScript, TanStack Router, and a component-based monorepo architecture for the Hello Ticket.

---

## 📚 Complete Documentation

**[View Full Frontend Documentation →](../docs/frontend/README.md)**

All comprehensive frontend documentation has been consolidated in the main docs folder.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint all packages
npm run lint
```

**Access**: http://localhost:3000

---

## 📁 Project Structure

```
frontend/
├── apps/
│   └── web/              # Main web application
│       ├── src/
│       │   ├── components/  # App components
│       │   ├── pages/       # Page components
│       │   ├── routes/      # TanStack Router routes
│       │   └── providers/   # Context providers
│       └── vite.config.ts
│
└── packages/             # Shared packages (monorepo)
    ├── ui/              # shadcn/ui components
    ├── api/             # API client
    ├── config/          # Shared configuration
    ├── utils/           # Utility functions
    ├── account/         # User management
    └── custom-ui/       # Custom components
```

---

## ⚡ Key Features

- ✅ **TypeScript** - Full type safety
- ✅ **TanStack Router** - Type-safe routing
- ✅ **TanStack Query** - Server state management
- ✅ **Monorepo** - Organized package structure
- ✅ **shadcn/ui** - Beautiful, accessible components
- ✅ **Command Palette** - Spotlight-style search (⌘K)
- ✅ **Dark Mode** - System-aware theming
- ✅ **Responsive** - Mobile-first design
- ✅ **Session Management** - Auto-refresh, secure logout
- ✅ **Production Ready** - Console.log auto-removal

---

## 📦 Packages

### Core Packages

- **`@truths/ui`** - shadcn/ui component library
- **`@truths/api`** - API client with auto-refresh
- **`@truths/config`** - Shared configuration
- **`@truths/utils`** - Utility functions & logger

### Feature Packages

- **`@truths/account`** - User management components
- **`@truths/custom-ui`** - Custom components & patterns

---

## 🎯 Common Tasks

### Development

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

### Adding Components

```bash
# Add shadcn component
npx shadcn-ui@latest add button
```

### Using Packages

```typescript
// Import from packages
import { Button } from "@truths/ui";
import { api } from "@truths/api";
import { logger } from "@truths/utils";
import { UserList } from "@truths/account";
```

---

## 📖 Documentation Links

- **[Frontend Documentation](../docs/frontend/README.md)** - Complete guide
- **[Frontend Quick Start](../docs/frontend/QUICKSTART.md)** - 5-minute setup
- **[Architecture Guide](../docs/frontend/ARCHITECTURE.md)** - Monorepo structure
- **[Command Palette](../docs/frontend/COMMAND_PALETTE.md)** - Search feature
- **[Components](../docs/frontend/COMPONENTS.md)** - Component library
- **[Account Package](../docs/frontend/ACCOUNT_PACKAGE_GUIDE.md)** - User management

---

## 🔐 Security Features

- ✅ **Auto Token Refresh** - See [AUTOMATIC_TOKEN_REFRESH.md](./AUTOMATIC_TOKEN_REFRESH.md)
- ✅ **Secure Logout** - See [SECURE_LOGOUT.md](./SECURE_LOGOUT.md)
- ✅ **Session Management** - See [SESSION_MANAGEMENT_SUMMARY.md](./SESSION_MANAGEMENT_SUMMARY.md)
- ✅ **Console.log Removal** - Automatically stripped in production builds

---

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Router** - File-based routing
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible primitives
- **shadcn/ui** - Component system
- **Vite** - Build tool
- **Zod** - Runtime validation

---

## 🆘 Troubleshooting

### Build fails

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Type errors

```bash
# Run type check
npm run type-check
```

### Port already in use

```bash
# Check what's using port 3000
lsof -nP -iTCP:3000 | grep LISTEN

# Or change port in vite.config.ts
```

---

## 🎉 Learn More

Visit the **[complete frontend documentation](../docs/frontend/README.md)** for detailed guides, architecture explanations, and best practices.

---

**Built with modern React patterns and best practices** 🚀
