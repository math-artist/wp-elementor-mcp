# Contributing to WP Elementor MCP

Thank you for your interest in contributing to the WP Elementor MCP project! This document outlines our development workflow and guidelines.

## Development Workflow

### Branch Structure

- **`main`**: Production-ready code. All releases are published from this branch.
- **`develop`**: Main development branch. All feature branches should branch from and merge back to this branch.
- **Feature branches**: Individual features or bug fixes (e.g., `feature/new-widget-support`, `fix/authentication-bug`)

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/wp-elementor-mcp.git
   cd wp-elementor-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

### Development Process

#### 1. Create a Feature Branch
Always branch from `develop` for new features:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

#### 2. Make Your Changes
- Write code following the existing style
- Add tests for new functionality
- Update documentation as needed
- Run tests locally: `npm run test:all`

#### 3. Commit Your Changes
Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add support for new widget types"
```

#### 4. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a pull request from your feature branch to `develop`.

### Pull Request Guidelines

1. **Target Branch**: All PRs should target the `develop` branch (unless it's a hotfix)
2. **Fill out the PR template** with all required information
3. **Ensure tests pass**: CI will run automatically
4. **Update version if needed**: Follow semantic versioning
5. **Request review**: Wait for maintainer approval

### Release Process

1. **Create Release PR**: When ready for release, create a PR from `develop` to `main`
2. **Update version**: Bump version in `package.json` following [semantic versioning](https://semver.org/)
3. **Update changelog**: Document changes in the PR description
4. **Merge to main**: After approval and CI passes, merge the PR
5. **Automatic publishing**: GitHub Actions will automatically:
   - Run tests
   - Build the package
   - Publish to npm (if version changed)
   - Create GitHub release
   - Tag the release

## Branch Protection Rules

The `main` branch is protected with the following rules:
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict pushes to this branch (no direct commits)

## Testing

### Running Tests Locally

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:comprehensive
npm run test:validate
npm run test:summary
```

### Test Requirements
- All new features must include tests
- Tests must pass in CI before merging
- Maintain or improve test coverage

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Versioning

We use [Semantic Versioning](https://semver.org/):

- **PATCH** (1.0.1): Bug fixes and minor improvements
- **MINOR** (1.1.0): New features that are backward compatible
- **MAJOR** (2.0.0): Breaking changes

### When to Bump Versions

- **Patch**: Bug fixes, documentation updates, small improvements
- **Minor**: New features, new tools, enhanced functionality
- **Major**: Breaking API changes, significant refactoring

## Continuous Integration

### CI Workflows

1. **CI (`ci.yml`)**: Runs on PRs to `main` and pushes to `develop`
   - Tests on Node.js 18.x and 20.x
   - Builds the project
   - Runs test suites
   - Verifies TypeScript compilation

2. **Publish (`publish.yml`)**: Runs on pushes to `main`
   - Runs full test suite
   - Checks for version changes
   - Publishes to npm if version changed
   - Creates GitHub release and tags

### Required Secrets

To enable automatic publishing, add these secrets to your GitHub repository:

1. **`NPM_TOKEN`**: Your npm publish token
   - Go to [npmjs.com](https://www.npmjs.com/) → Account → Access Tokens
   - Create an "Automation" token
   - Add it as a repository secret

2. **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions

## Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers directly for sensitive issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 