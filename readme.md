# TaskFlow

> *Bringing structure and control to AI-assisted coding workflows*

## The Problem

Current AI assistant coding workflows are chaotic. While tools like Cursor, Windsurf, and other Model Context Protocol (MCP) clients unlock powerful AI pair programming capabilities, they frequently suffer from critical issues:

- 🧠 **Context amnesia** - Models forget what they were working on
- 🔄 **Unfocused changes** - Files modified with no clear task boundaries
- 🌊 **Workflow turbulence** - No checkpointing or progress tracking
- 🚧 **Lack of transparency** - Difficult to audit what changed and why

## What is TaskFlow?

TaskFlow is an innovative MCP server that brings structured task management to AI-assisted coding. It creates a framework for more controlled, transparent, and effective AI collaboration through **enforced checkpointing** and **session tracking**.

Unlike traditional approaches that try to limit AI capabilities, TaskFlow enhances them by adding crucial process guardrails:

```
      ┌───────────────┐      ┌───────────────┐
User ─┤ MCP Client    │──────┤ TaskFlow      │
      │ (e.g. Cursor) │      │ Server        │
      └───────────────┘      └───────────────┘
                                    │
                                    ▼
                             ┌───────────────┐
                             │ Session &     │
                             │ Change        │
                             │ Tracking      │
                             └───────────────┘
```

## Key Features

### ✅ Session Initialization

Every conversation begins with a structured initialization, capturing:

- Task type (code-editing, planning, research, etc.)
- Context description
- Session tracking ID

### 📝 File Change Tracking

Every file operation must be explicitly recorded:

- Created, modified, or deleted files
- Automatic association with sessions
- Historical file change tracking

### 🔄 Progress Checkpoints

Regular progress documentation is enforced:

- Current progress summary
- Change descriptions
- Reasoning and thought process
- Planned next steps

### 📊 Data Persistence

All data is stored in a lightweight JSON structure:

- Session information
- File change history
- Progress checkpoints
- Associations between actions

## Why It Works

TaskFlow takes advantage of a key insight: **AI assistants will follow clear, consistent instructions in tool responses**. Rather than trying to "control" the AI through prompting alone, TaskFlow adds structural constraints by:

1. **Requiring initialization** - Creating a clear session start
2. **Enforcing documentation** - Mandatory tracking of file changes
3. **Demanding checkpoints** - Regular progress summaries
4. **Persistent reminders** - Each tool response reinforces proper workflow

## Getting Started

### Prerequisites

- Node.js v16+
- An MCP client like Cursor or any other Model Context Protocol compatible editor

### Installation

```bash
# Clone the repository
git clone https://github.com/stumason/taskflow.git

# Install dependencies
cd taskflow
npm install

# Start the server
npm start
```

### Connecting to an MCP client

TaskFlow uses the standard MCP STDIO interface. In Cursor, you can configure it by:

1. Open Settings
2. Navigate to AI > Advanced
3. Set "Model Context Protocol Server" to the path of your TaskFlow server.js
4. Restart Cursor

## Roadmap

TaskFlow is under active development. Future enhancements include:

- [ ] **Session Review Tool** - Generate summaries of completed sessions
- [ ] **User Feedback Integration** - Allow explicit approval/rejection of changes
- [ ] **Web Dashboard** - Visual reporting of sessions and changes
- [ ] **Git Integration** - Associate sessions with commits
- [ ] **Multi-Agent Support** - Coordinated workflows across multiple AI agents
- [ ] **Task Templates** - Pre-defined structured workflows for common tasks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

TaskFlow was created to make AI-assisted coding more predictable, transparent, and effective. By adding structure to the chaotic world of "vibe coding," it aims to enhance rather than restrict the powerful capabilities of modern AI coding assistants.
