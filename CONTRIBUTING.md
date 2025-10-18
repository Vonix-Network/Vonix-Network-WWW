# Contributing to Vonix Network

Thank you for your interest in contributing to Vonix Network! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- A Turso account (for database)
- Basic knowledge of React, Next.js, and TypeScript

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/vonix-network.git
   cd vonix-network
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/originalowner/vonix-network.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

### 3. Database Setup

```bash
# Set up Turso database
npm run db:push

# Run migrations
npm run db:migrate-all
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Start Discord Bot (Optional)

```bash
npm run bot
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports**: Report bugs and issues
- **Feature Requests**: Suggest new features
- **Code Contributions**: Submit bug fixes and new features
- **Documentation**: Improve documentation
- **Testing**: Add or improve tests
- **Design**: UI/UX improvements

### Before You Start

1. Check existing issues and pull requests
2. Create an issue for significant changes
3. Discuss large changes in advance
4. Ensure your changes align with project goals

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

### 5. PR Requirements

Your pull request should:

- Have a clear, descriptive title
- Include a detailed description
- Reference any related issues
- Include screenshots for UI changes
- Pass all tests and linting
- Be up to date with the main branch

## 🐛 Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, Node.js version)
5. **Screenshots** if applicable
6. **Error messages** or logs

### Feature Requests

For feature requests, please include:

1. **Clear title** describing the feature
2. **Detailed description** of the feature
3. **Use case** and motivation
4. **Proposed implementation** (if you have ideas)
5. **Additional context** or examples

## 📏 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use strict type checking

### React/Next.js

- Use functional components with hooks
- Follow Next.js 14 App Router patterns
- Use proper error boundaries
- Implement proper loading states

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Write self-documenting code
- Add comments for complex logic

### File Organization

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── admin/          # Admin-specific components
│   └── ...
├── lib/                # Utility libraries
├── db/                 # Database configuration
└── types/              # TypeScript types
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserData`)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Test edge cases and error conditions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const props = { ... };
    
    // Act
    const result = componentFunction(props);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Include usage examples
- Keep README files updated

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes
- Keep API docs in sync with code

## 🏗️ Architecture Guidelines

### Component Design

- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Handle loading and error states

### State Management

- Use React Query for server state
- Use Zustand for client state
- Avoid prop drilling
- Keep state as local as possible

### Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use dynamic imports for large components

## 🔍 Review Process

### For Contributors

1. Ensure your PR is ready for review
2. Respond to feedback promptly
3. Make requested changes
4. Keep PRs focused and small
5. Test your changes thoroughly

### For Maintainers

1. Review code for quality and correctness
2. Check for security issues
3. Ensure tests are adequate
4. Verify documentation is updated
5. Provide constructive feedback

## 🎯 Areas for Contribution

### High Priority

- Bug fixes and performance improvements
- Security enhancements
- Documentation improvements
- Test coverage improvements

### Medium Priority

- New features and enhancements
- UI/UX improvements
- API improvements
- Developer experience improvements

### Low Priority

- Code refactoring
- Dependency updates
- Tooling improvements
- Examples and tutorials

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: Join our community Discord server
- **Email**: Contact maintainers directly

## 🏆 Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community acknowledgments

## 📄 License

By contributing to Vonix Network, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Vonix Network! Your contributions help make this project better for the entire Minecraft community.

