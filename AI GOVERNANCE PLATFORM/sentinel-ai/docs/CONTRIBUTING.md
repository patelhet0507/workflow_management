# Contributing

## Development Setup

```bash
# Clone the repository
git clone https://github.com/sentinel-ai/sentinel.git
cd sentinel

# Install dependencies
npm install

# Start development server
npm run dev
```

## Code Style

- Use TypeScript for all source code
- Follow the existing folder structure and naming conventions
- Keep components small and focused — one responsibility per component
- Separate UI from business logic
- Never hardcode data structures — use types and constants
- Write reusable components following the shadcn/ui pattern
- Use Tailwind CSS classes only — no inline styles
- Add Framer Motion animations for interactive elements

## Component Guidelines

```
src/components/
├── ui/        # Generic, reusable primitives (Button, Card, Badge, etc.)
├── layout/    # Layout components (Sidebar, TopNav, Footer)
└── dashboard/ # Dashboard-specific widgets (StatsCards, Charts, etc.)
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Run `npm run build` to verify the build passes
4. Run `npm run lint` to check for lint issues
5. Update relevant documentation if needed
6. Open a pull request with a clear description of changes

## Commit Conventions

Follow conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code restructuring
- `style:` — Styling changes (CSS, formatting)
- `chore:` — Build, CI, dependencies

## Testing

- Write tests for all non-trivial logic
- Place tests alongside the component in a `__tests__/` directory
- Use descriptive test names that explain the expected behavior

## Questions?

Open a GitHub Discussion or reach out in the #contributors channel.
