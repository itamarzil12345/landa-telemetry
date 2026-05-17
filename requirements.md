# Code Quality Requirements

This document defines the code quality rules for the project.

## General Requirements

- Keep individual source files to **no more than 100 lines** when practical.
- Maintain a clear and consistent project structure.
- Use meaningful names for files, classes, methods, and variables.
- Avoid deep nesting or overly complex methods.
- Keep services and functionality separated by responsibility.
- Use interfaces, dependency injection, and abstraction where appropriate.

## Coding Style

- Prefer expressive logic over shortcuts.
- Use strongly typed models and DTOs instead of untyped data structures.
- Avoid magic numbers and duplicate literals.
- Avoid hard-coded connection strings, secrets, or environment values in source code.
- Keep configuration in `appsettings`, environment variables, or Docker compose.

## Strings and Constants

- Do not scatter literal strings throughout the codebase.
- Define reusable constants for queue names, configuration keys, route paths, and any repeated string values.
- Centralize commonly used values in dedicated helper classes or constants files.

## Patterns and Practices

- Use async/await for I/O-bound operations.
- Prefer small, focused methods with a single responsibility.
- Use dependency injection for services and external dependencies.
- Keep communication boundaries explicit: REST for UI/API only, SignalR for API/UI only, gRPC and RabbitMQ for backend service communication only.
- Use proper error handling and logging for service operations.

## Tests and Documentation

- Write unit tests for all backend services.
- Include integration tests for end-to-end real-time behavior.
- Keep test files clear and focused on one behavior set.
- Document AI prompts and design assumptions in the `/prompts` folder.

## Maintainability

- Keep each file understandable without requiring deep context.
- Prefer composition over inheritance unless the domain clearly benefits.
- Avoid tightly coupling services or modules.
- Keep external dependencies limited to what is needed for the service.

## Review Checklist

- Does each file stay under 100 lines when practical?
- Are repeated strings replaced with constants?
- Are service boundaries clear and enforced?
- Does code avoid direct environment or secret literals?
- Are async flows and error paths handled cleanly?
- Is the folder structure intuitive and modular?
