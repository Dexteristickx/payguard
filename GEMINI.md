# Agent Context & State Preservation Protocol

You must maintain autonomous state tracking so that context is never lost across sessions, when chat history is truncated, or when the server clears a prefix of the conversation.

## 1. State Tracking File (`PROGRESS.md`)
- Always maintain a file named `PROGRESS.md` in the active project or workspace root directory.
- If `PROGRESS.md` does not exist in the project, create it immediately based on the project goals, requirements, and current workspace state.
- Structure of `PROGRESS.md`:
  - **Project Goal & Scope**: Summary of what the project is, user requirements, and constraints.
  - **Tech Stack & Architectural Decisions**: Core framework, libraries, conventions, and key decisions.
  - **Task Checklist**:
    - `[x]` Completed tasks (with brief summary of what was implemented/fixed)
    - `[/]` Currently active task
    - `[ ]` Upcoming tasks in order of priority
  - **Key Files & Recent Modifications**: Key files touched and their current status.
  - **Next Immediate Action**: The exact next step to execute.

## 2. Autonomous Sync Rules
- Before starting any action, check `PROGRESS.md` to confirm current state.
- After completing any task or milestone, immediately update `PROGRESS.md` before moving to the next task.
- Keep terminal commands and file inspections targeted to avoid bloating conversation history.

## 3. Session Resumption Protocol
- Whenever a new conversation starts, or if chat history was truncated / cleared:
  1. Inspect `PROGRESS.md` (and relevant workspace files) first.
  2. Briefly state: "Resumed from PROGRESS.md: Completed [last step], now proceeding with [next step]."
  3. Continue execution autonomously without losing context or drifting.
