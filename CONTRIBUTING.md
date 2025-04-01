# 🤝 Contributing to Socket Bridge

Thank you for considering contributing to Socket Bridge! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

Bug reports are valuable contributions. To report a bug:

1. Check if the bug has already been reported
2. Use the bug report template when creating a new issue
3. Include detailed steps to reproduce the bug
4. Include any relevant logs, error messages or screenshots
5. Describe the expected behavior vs actual behavior

### Suggesting Enhancements

Enhancement suggestions help improve Socket Bridge. When suggesting an enhancement:

1. Use the feature request template when creating a new issue
2. Clearly describe the proposed functionality
3. Explain why this enhancement would be useful to users
4. Include any examples of similar features in other projects (if applicable)

### Code Contributions

Code contributions are welcome! Here's how to contribute code:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests to ensure your changes don't break existing functionality
5. Commit your changes with clear commit messages
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

To set up the project for local development:

1. Fork and clone the repository
   ```bash
   git clone https://github.com/novincode/socket-bridge.git
   cd socket-bridge
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create your environment configuration
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation if you're changing functionality
3. Your PR should pass all CI checks and tests
4. A maintainer will review your PR and may request changes
5. Once approved, your PR will be merged

## Coding Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Write comments for complex logic
- Include JSDoc comments for public APIs
- Follow the existing code style

## Commit Messages

We follow conventional commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or modifying tests
- `chore:` - Changes to the build process or auxiliary tools
