# Contributing to ChatNexus

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/chatnexus.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes: `npm run build`
6. Commit your changes (see commit guidelines below)
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Code Style

- Follow the existing code style
- Use Prettier for formatting (2-space indentation)
- Use TypeScript for type safety
- Write descriptive variable and function names
- Add comments for complex logic

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs(scope): update documentation`
- `refactor(scope): refactor code`
- `test(scope): add tests`
- `chore(scope): update dependencies`

Examples:

- `feat(bedrock): add AWS Bedrock provider support`
- `fix(sidebar): resolve icon visibility in collapsed mode`
- `docs(readme): update installation instructions`

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Ensure all tests pass
- Add screenshots for UI changes
- Reference related issues

## Accessibility

- Follow WCAG 2.1 AA standards
- Test with keyboard navigation
- Ensure proper color contrast
- Add ARIA labels where needed

## Questions?

Feel free to open an issue for questions or discussions.
