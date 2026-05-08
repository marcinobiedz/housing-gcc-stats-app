# Project Context: HTML Page Parser

## Core Directives
- **Language:** Always write code, logs, and variable names in English.
- **Communication:** Respond concisely in Polish.
- **Style:** No comments. Keep the code clean and surgical.
- **Coding Principles:**
  - **YAGNI:** Do not implement features until they are needed.
  - **DRY:** Avoid code duplication.
  - **Pure Functions:** Prefer deterministic functions with no side effects where possible.
  - **TypeScript:** Avoid all type casting (`as`, `<Type>`). Use type guards, proper interfaces, or type inference instead.
- **Approach:** Use `fetch` for downloading HTML pages.
- **Architecture:**
  - `src/index.ts`: Main entry point.
  - `src/types.ts`: Shared type definitions.

## Technical Standards
- **Runtime:** Node.js with TypeScript.
- **HTML Parsing:** `cheerio` for DOM manipulation.
- **Validation:** Always verify API/HTML response structure before processing.

## Current Workflow
1. Fetch HTML from URL using built-in `fetch`.
2. Parse HTML with `cheerio`.
3. Extract data (links, images, title, etc.).