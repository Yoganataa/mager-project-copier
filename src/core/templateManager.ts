// src/core/templateManager.ts
import * as vscode from 'vscode';

/**
 * Unique identifier for a prompt template.
 */
export type TemplateId = string;

/**
 * Represents a prompt template used to wrap the project snapshot.
 */
export interface Template {
  /** Unique identifier for the template. */
  id: TemplateId;
  /** Display name shown in the UI. */
  label: string;
  /** Short description of the template's purpose. */
  description: string;
  /**
   * Constructs the final prompt by combining the project context with specific instructions.
   *
   * @param context - The raw project snapshot containing structure and code.
   * @returns The fully formatted prompt string.
   */
  build: (context: string) => string;
}

/**
 * Collection of hardcoded, built-in templates.
 */
const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'default',
    label: 'Standard Context (Raw)',
    description: 'Copies code and structure without additional instructions.',
    build: (context) => context
  },
  {
    id: 'review',
    label: 'Code Review & Best Practices',
    description: 'Deep analysis of code quality, clean code, and performance.',
    build: (context) => `
You are an expert Principal Software Engineer. I have provided the project structure and source code below.
Your task is to perform a comprehensive Code Review.

# Focus Areas:
1. **Code Quality**: Clean code principles, DRY, separation of concerns.
2. **Performance**: Identify potential bottlenecks or inefficient logic.
3. **Safety**: Spot potential bugs or race conditions.
4. **Modern Practices**: Suggest modern alternatives to outdated patterns used here.

# Project Context:
${context}

# Instructions:
Provide your review in a structured format with priority levels (High/Medium/Low) for each suggestion.
`.trim()
  },
  {
    id: 'bugfix',
    label: 'Find Bugs & Error Handling',
    description: 'Scans for logical bugs, edge cases, and poor error handling.',
    build: (context) => `
You are an expert Debugger and QA Engineer. Analyze the following project code specifically for BUGS and LOGICAL ERRORS.

# Look for:
- Unhandled exceptions / edge cases.
- Race conditions or async/await mistakes.
- Memory leaks or resource management issues.
- Logic errors that deviate from standard patterns.

# Project Context:
${context}

# Output:
List the detected issues. For each issue, explain *why* it is a bug and provide the *corrected* code snippet.
`.trim()
  },
  {
    id: 'explain',
    label: 'Explain Architecture',
    description: 'Explains workflow, folder structure, and project goals.',
    build: (context) => `
You are a Technical Lead onboarding a new developer.
Read the following project structure and code.

# Task:
1. **High-Level Summary**: What does this project do?
2. **Architecture**: Explain the folder structure and how components interact.
3. **Key Files**: Highlight the most important files and their roles.

# Project Context:
${context}
`.trim()
  },
  {
    id: 'security',
    label: 'Security Audit',
    description: 'Checks for vulnerabilities (XSS, Injection, Secrets, etc.).',
    build: (context) => `
You are a Cybersecurity Expert. Perform a Security Audit on the provided code.

# Audit Checklist:
- Injection vulnerabilities (SQL, NoSQL, Command).
- Hardcoded secrets or credentials.
- Insecure data handling (PII exposure).
- XSS or CSRF vulnerabilities (if web-based).

# Project Context:
${context}

# Report:
Provide a security report listing vulnerabilities by severity (Critical/High/Medium) and mitigation steps.
`.trim()
  },
  {
    id: 'refactor',
    label: 'Refactoring Suggestions',
    description: 'Suggestions to improve maintainability and structure.',
    build: (context) => `
You are a Refactoring Specialist. I want to improve the maintainability of this code.

# Task:
Identify complex functions, duplicate logic, or messy components that should be refactored.
Propose a cleaner, more modular implementation.

# Project Context:
${context}
`.trim()
  }
];

/**
 * Retrieves all available templates, combining built-in presets with user-defined custom templates.
 * * Custom templates are fetched from the VS Code configuration (`magerProject.customTemplates`).
 *
 * @returns An array of {@link Template} objects.
 */
export function getTemplates(): Template[] {
  const config = vscode.workspace.getConfiguration('magerProject');
  const customTemplatesConfig = config.get<any[]>('customTemplates') || [];

  const customTemplates: Template[] = customTemplatesConfig.map((t: any) => ({
    id: t.id || 'custom-' + Math.random().toString(36).substr(2, 9),
    label: t.label || 'Custom Template',
    description: t.description || 'User defined template',
    build: (context: string) => {
      let raw = t.prompt || '{context}';
      return raw.replace('{context}', context);
    }
  }));

  return [...BUILT_IN_TEMPLATES, ...customTemplates];
}

/**
 * Generates the final prompt string by applying a specific template to the project snapshot.
 * * If the requested template ID is not found, the function falls back to the default template.
 *
 * @param snapshot - The project content to be wrapped.
 * @param templateId - The ID of the template to apply.
 * @returns The fully constructed prompt string.
 */
export function applyTemplate(
  snapshot: string,
  templateId: string
): string {
  const allTemplates = getTemplates();
  const template = allTemplates.find(t => t.id === templateId) ?? allTemplates[0];
  return template.build(snapshot);
}