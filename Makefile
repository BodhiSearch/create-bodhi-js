.PHONY: all setup install build clean lint lint-fix typecheck release help test

all: lint-fix build typecheck ## Default target: lint, build, and typecheck

setup: ## Install dependencies using npm ci
	npm ci

install: ## Install dependencies using npm install
	npm install

build: ## Build the CLI package
	npm run build

clean: ## Clean build artifacts
	rm -rf dist

check: ## Run ESLint checks
	npm run lint

check.fix: ## Fix ESLint and formatting issues
	npm run lint:fix
	$(MAKE) typecheck

typecheck: ## Run TypeScript type checking
	npm run typecheck

test: ## Run tests
	npm run test

release: ## Create and push tag for create-bodhi-js release
	@echo "Preparing to release create-bodhi-js..."
	@node scripts/git-check-branch.js
	@node scripts/git-check-sync.js
	@CURRENT_VERSION=$$(node scripts/get-npm-version.js create-bodhi-js) && \
	NEXT_VERSION=$$(node scripts/increment-version.js $$CURRENT_VERSION) && \
	echo "Current version on npmjs: $$CURRENT_VERSION" && \
	echo "Next version to release: $$NEXT_VERSION" && \
	TAG_NAME="v$$NEXT_VERSION" && \
	node scripts/delete-tag-if-exists.js "$$TAG_NAME" && \
	echo "Creating tag $$TAG_NAME..." && \
	git tag "$$TAG_NAME" && \
	git push origin "$$TAG_NAME" && \
	echo "Tag $$TAG_NAME pushed. GitHub workflow will handle the release process."

.DEFAULT_GOAL := help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9._-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
