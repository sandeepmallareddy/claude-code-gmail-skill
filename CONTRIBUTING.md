# Contributing to Claude Code Gmail Skill

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git
- A Google account (for testing)

### Setting Up Development Environment

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/claude-code-gmail-skill.git
   cd claude-code-gmail-skill
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/ORIGINAL-USER/claude-code-gmail-skill.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

## Making Changes

### Code Style

- Follow existing code patterns in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Run `npm run lint` before committing (if available)

### Testing

1. **Add tests for new features**
2. **Run existing tests**

   ```bash
   npm test
   ```

### Committing

1. **Stage your changes**

   ```bash
   git add .
   ```

2. **Write a commit message**

   ```
   type(scope): subject

   - Description of change
   - Another description if needed

   Fixes #issue-number
   ```

   **Types:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation only
   - `style`: Code style changes
   - `refactor`: Code refactoring
   - `test`: Adding tests
   - `chore`: Maintenance tasks

3. **Commit**

   ```bash
   git commit -m "Your commit message"
   ```

### Pushing

```bash
git push origin feature/your-feature-name
```

## Submitting a Pull Request

1. **Create PR**

   Go to your forked repository on GitHub and click "New Pull Request"

2. **Fill out the template**

   - Describe your changes
   - List any breaking changes
   - Add screenshots for UI changes
   - Link related issues

3. **Review process**

   - Maintainers will review your PR
   - Address any feedback
   - Once approved, your PR will be merged

## Reporting Issues

### Before Reporting

- Search existing issues
- Update to the latest version
- Reproduce the issue

### When Reporting

Use the issue template and provide:

- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs if applicable
- Environment details (OS, Node version)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

- Open an issue for discussion
- Check existing documentation
- Review related issues

---

**Thank you for contributing!**
