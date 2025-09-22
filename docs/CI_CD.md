# CI/CD Pipeline Documentation

## Overview

This project has a comprehensive CI/CD pipeline that ensures code quality, security, and performance before deployment.

## Pre-commit Hooks (Husky)

### Setup
```bash
npm install  # Husky is automatically set up via prepare script
```

### Hooks

#### 1. **pre-commit**
Runs before every commit to ensure code quality:
- **Lint-staged**: Runs ESLint and Prettier on staged files
- **Type checking**: Ensures TypeScript types are valid
- **Console.log check**: Prevents console statements in production code

#### 2. **commit-msg**
Validates commit messages follow conventional format:
- Format: `type(scope?): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `security`, `deps`
- Example: `feat(auth): add social login support`

## GitHub Actions Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers**: Push to main/develop, Pull requests

**Jobs**:

#### Lint & Type Check
- Runs ESLint for code quality
- TypeScript type checking
- Checks for console.log statements

#### Security Audit
- npm audit for vulnerable dependencies
- Scans for hardcoded secrets
- Security pattern detection

#### Build & Bundle Analysis
- Builds the application
- Analyzes bundle sizes
- Checks against size limits (1MB max)
- Uploads build artifacts

#### Code Quality
- Counts lines of code
- Checks for TODO/FIXME comments
- Identifies large files (>300 lines)
- Code complexity analysis

#### Dependency Check
- Lists outdated dependencies
- Checks for duplicate packages

#### Performance Check
- Placeholder for Lighthouse CI
- Web Vitals monitoring (when configured)

### 2. Deploy Pipeline (`deploy.yml`)

**Triggers**: Push to main branch, Manual dispatch

**Steps**:
1. Run tests and type checking
2. Build application
3. Deploy to Vercel production
4. Comment deployment URL on PR (if applicable)

**Required Secrets**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

### 3. Bundle Size Analysis (`bundle-size.yml`)

**Triggers**: Pull requests that modify source code

**Features**:
- Compares bundle size between PR and base branch
- Generates detailed size report
- Comments on PR with size changes
- Warns if bundle exceeds 1MB
- Shows individual file sizes with gzip comparison

### 4. Code Coverage (`code-coverage.yml`)

**Triggers**: Push to main/develop, Pull requests

**Features** (ready when tests are implemented):
- Runs tests with coverage
- Uploads to Codecov
- Generates coverage badge
- Comments coverage percentage on PR

## Local Development Scripts

### Quality Checks
```bash
# Run all checks
npm run check:all

# Individual checks
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run format:check  # Prettier

# Fix issues
npm run fix:all       # Fix all auto-fixable issues
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
```

### Bundle Analysis
```bash
npm run analyze  # Opens bundle visualizer in browser
```

### Pre-commit Testing
```bash
# Test pre-commit hooks without committing
npm run pre-commit
```

## Configuration Files

### `.lintstagedrc.json`
Configures which commands run on staged files:
- JavaScript/TypeScript: ESLint + Prettier
- JSON/YAML/Markdown: Prettier
- CSS: Prettier

### `commitlint.config.js`
Enforces conventional commit format with custom rules:
- Maximum header length: 100 characters
- Required commit types defined
- Subject cannot be empty
- No period at end of subject

### `.prettierrc`
Code formatting rules:
- Single quotes
- Semicolons required
- 2-space indentation
- Max line width: 100 characters
- Trailing commas in ES5

### `.eslintrc.json`
Comprehensive linting rules including:
- TypeScript strict mode
- React best practices
- No console statements
- No unused variables
- Import ordering

## Best Practices

### 1. Commit Messages
```bash
# Good examples
git commit -m "feat: add user authentication"
git commit -m "fix(api): resolve timeout issue in payment processing"
git commit -m "perf: optimize image loading with lazy loading"

# Bad examples
git commit -m "fixed stuff"  # Too vague
git commit -m "FEAT: Add auth"  # Wrong case
git commit -m "add auth."  # Has period
```

### 2. Branch Protection
Recommended GitHub settings:
- Require pull request reviews
- Require status checks (CI Pipeline)
- Require branches to be up to date
- Include administrators

### 3. Pull Request Flow
1. Create feature branch from develop
2. Make changes and commit (hooks run automatically)
3. Push to GitHub
4. CI Pipeline runs automatically
5. Bundle size analysis on PR
6. Code review
7. Merge to develop
8. Automatic deployment to staging (if configured)
9. Merge develop to main for production deployment

## Monitoring

### Build Status
Check GitHub Actions tab for:
- Build success/failure
- Test results
- Bundle size trends
- Security issues

### Bundle Size
Monitor via:
- PR comments from bundle-size workflow
- `npm run analyze` locally
- Build artifacts in GitHub Actions

### Code Quality
Track via:
- ESLint reports in CI
- TypeScript errors
- TODO/FIXME count
- Large file warnings

## Troubleshooting

### Husky hooks not running
```bash
# Reinstall Husky
npm run prepare
chmod +x .husky/*
```

### Commit rejected by commitlint
```bash
# Check valid types
npx commitlint --help

# Test your message
echo "feat: my message" | npx commitlint
```

### CI Pipeline failing
1. Check GitHub Actions logs
2. Run checks locally: `npm run check:all`
3. Fix issues: `npm run fix:all`
4. Verify build: `npm run build`

### Bundle size exceeding limit
1. Run `npm run analyze` to identify large dependencies
2. Consider code splitting
3. Remove unused dependencies
4. Use dynamic imports for large components

## Future Enhancements

- [ ] Add E2E testing with Playwright
- [ ] Implement Lighthouse CI for performance monitoring
- [ ] Add SonarQube for advanced code analysis
- [ ] Set up staging environment auto-deployment
- [ ] Add visual regression testing
- [ ] Implement dependency update automation (Renovate/Dependabot)
- [ ] Add security scanning with Snyk
- [ ] Set up performance budgets
- [ ] Add accessibility testing automation
- [ ] Implement blue-green deployments