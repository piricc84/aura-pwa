# Contributing to AURA

Thank you for your interest in contributing to AURA! This document outlines how to get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report concerns to the maintainers

## Getting Started

### 1. Fork the Repository

```bash
# On GitHub, click "Fork" button
# Clone your fork locally
git clone https://github.com/YOUR_USERNAME/aura-pwa.git
cd aura-pwa
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/issue-description
```

### 3. Set Up Development Environment

```bash
npm install
npm run dev
# Open http://localhost:8000
```

### 4. Make Your Changes

- Keep changes focused and minimal
- Follow the existing code style
- Write clear commit messages

### 5. Test Your Changes

```bash
npm run test
npm run build
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add new feature" # or "fix:", "docs:", etc.
git push origin feature/my-feature
```

### 7. Open a Pull Request

- Write a clear description of your changes
- Reference any related issues (#123)
- Include before/after if applicable

---

## Development Guidelines

### Code Style

- **JavaScript**: Vanilla ES6+, no transpilation
- **CSS**: Follow existing variable naming (--accent, --bg0, etc.)
- **HTML**: Semantic markup with ARIA labels

### Project Structure

```
src/
├── index.html    # Main app (loads CSS/JS externally)
├── css/
│   └── main.css  # All styles here
├── js/
│   └── app.js    # All app logic here
├── icons/        # PWA icons
├── sw.js         # Service Worker
└── manifest.webmanifest
```

### Naming Conventions

- Classes: `camelCase` (`.elfWrap`, `.audioPanel`)
- CSS Variables: `kebab-case` (`--bg0`, `--accent-color`)
- Functions: `camelCase` (`audioStart()`, `openModal()`)
- Constants: `UPPER_SNAKE_CASE` (`CACHE`, `USERS_KEY`)

### Adding Features

**Audio Ambience**
- Add new environment in `buildAmbience()`
- Update `<option>` in manifest
- Test frequencies and gain levels

**Mood Categories**
- Add to `advice` object
- Update UI buttons in HTML
- Add emoji representation

**Themes**
- Add to `themes` object in app.js
- Update CSS custom properties
- Test on multiple devices

### Testing

Run quality checks before committing:

```bash
npm run test     # Code quality
npm run build    # Production build
npm run dev      # Manual testing
```

### Performance Targets

- CSS: < 50KB
- JavaScript: < 50KB
- Total (gzipped): < 20KB
- Lighthouse PWA: 95+

---

## Issue Guidelines

### Reporting Bugs

Include:
- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/video if helpful
- Console errors (if any)

### Feature Requests

Include:
- Clear description of the feature
- Use case/why it's needed
- Proposed implementation (optional)
- Related issues or discussions

---

## Documentation

- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment changes
- Add comments for complex logic
- Keep JSDoc style for functions:
  ```javascript
  /**
   * Opens a modal dialog
   * @param {Object} config - Modal configuration
   * @param {string} config.title - Modal title
   * @param {function} config.onClose - Close callback
   * @returns {Promise<boolean>}
   */
  ```

---

## Commit Message Format

Follow conventional commits:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no logic change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build, dependencies, etc.

**Example:**
```
feat(audio): add new river ambience

Implements a new river soundscape using sine waves
and white noise filtering. Adds dropdown option in
audio panel.

Closes #45
```

---

## Pull Request Checklist

Before submitting:

- [ ] Code follows project style
- [ ] Tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Commit messages are clear
- [ ] Documentation updated
- [ ] Changes work on mobile devices
- [ ] Performance targets met

---

## Review Process

1. **Initial Review**: Check for completeness and style
2. **Code Review**: Verify implementation quality
3. **Testing**: Ensure functionality and no regressions
4. **Merge**: Once approved, squash and merge to main

---

## Questions or Discussions?

- Open a GitHub Discussion for Q&A
- Comment on related issues
- Join our community (if applicable)

---

## License

By contributing, you agree your code will be licensed under MIT License.

---

**Thank you for making AURA better! 🌿**
