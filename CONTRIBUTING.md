# Contributing to Training Hamza

Thank you for your interest in contributing to this project!

## Development Workflow

1. **Create a Linear issue** for the feature/bug you're working on
2. **Create a feature branch** from `development`: `git checkout -b feature/LINEAR-XXX-short-description`
3. **Make your changes** following the code style guidelines
4. **Write tests** to cover your changes
5. **Run tests locally** to ensure nothing is broken
6. **Commit your changes** with clear, descriptive messages
7. **Push your branch** and create a Pull Request
8. **Link your PR to the Linear issue** using the PR template

## Pull Request Guidelines

- Use the PR template and fill out all sections
- Link to the Linear issue using format: `Fixes [LINEAR-XXX](https://linear.app/maximus/issue/LINEAR-XXX/title)`
- Ensure all CI checks pass (tests, linting, coverage)
- Request review from at least one team member
- Address all review comments before merging

## Testing Requirements

- **Unit tests**: All new functions/methods must have unit tests
- **Integration tests**: API endpoints require integration tests
- **Contract tests**: API changes require contract test updates
- **A11y tests**: UI components must pass WCAG 2.1 AA standards
- **Coverage**: Maintain minimum 80% code coverage

## Code Style

- Follow existing code patterns and conventions
- Use ESLint and Prettier configurations
- Write clear, self-documenting code
- Add comments for complex logic
- Use TypeScript for frontend code
- Use JSDoc comments for JavaScript functions

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(auth): add Firebase authentication integration

- Implement email/password sign-in
- Add auth context provider
- Create login form component

Fixes LINEAR-123
```

## Branch Naming

- `feature/LINEAR-XXX-short-description` for new features
- `fix/LINEAR-XXX-short-description` for bug fixes
- `docs/LINEAR-XXX-short-description` for documentation
- `refactor/LINEAR-XXX-short-description` for refactoring

## Questions?

Contact the team on Slack or create a discussion on GitHub.
