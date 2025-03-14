# TaskFlow

> *Bringing structure and control to AI-assisted coding workflows*

## Installation

I'm using Supabase for some reason. I'm not sure why.

```bash
git clone https://github.com/stumason/taskflow.git
cd taskflow
npm install 
npm run build
npx supabase start
```

### Claude Desktop

```json
    "taskflow": {
      "command": "node",
      "args": ["/path/to/mcp-taskflow/dist/index.js"]
    }
```

### Cursor

name: TaskFlow

type: Command

command: node /path/to/mcp-taskflow/dist/index.js

## The Problem

Current AI assistant coding workflows are chaotic. While tools like Cursor, Windsurf, and other Model Context Protocol (MCP) clients unlock powerful AI pair programming capabilities, they frequently suffer from critical issues:

- 🧠 **Context amnesia** - Models forget what they were working on
- 🔄 **Unfocused changes** - Files modified with no clear task boundaries
- 🌊 **Workflow turbulence** - No checkpointing or progress tracking
- 🚧 **Lack of transparency** - Difficult to audit what changed and why

## What is TaskFlow?

TaskFlow is an innovative MCP server that brings structured task management to AI-assisted coding. It creates a framework for more controlled, transparent, and effective AI collaboration through **enforced checkpointing**, **session tracking**, and a **hierarchical data model**.

Unlike traditional approaches that try to limit AI capabilities, TaskFlow enhances them by adding crucial process guardrails:

```
      ┌───────────────┐      ┌───────────────┐
User ─┤ MCP Client    │──────┤ TaskFlow      │
      │ (e.g. Cursor) │      │ Server        │
      └───────────────┘      └───────────────┘
                                    │
                                    ▼
                             ┌───────────────┐
                             │ Hierarchical  │
                             │ Data Model    │
                             └───────────────┘
                                    │
                                    ▼
                             ┌───────────────┐
                             │ Session &     │
                             │ Change        │
                             │ Tracking      │
                             └───────────────┘
```

## Hierarchical Data Structure

TaskFlow's enhanced data model establishes a clear workflow hierarchy:

```
Application (Software Product)
 └── Feature (Major Functionality)
     └── Task (Specific Work Item)
         └── Session (AI Working Period)
             ├── File Changes
             ├── Checkpoints
             ├── Snapshots
             └── Decisions
```

This structure forces AI assistants to:
- Work within defined task boundaries
- Maintain awareness of their place in the larger project
- Track the context of their changes
- Document decisions and progress

## Key Features

### ✅ Session Initialization

Every conversation begins with a structured initialization, capturing:

- Task type (code-editing, planning, research, etc.)
- Context description
- Session tracking ID
- Links to application, feature, and task (if applicable)
- Historical context from previous sessions

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

### 📸 Content Snapshots

Point-in-time captures of file contents:

- Complete file contents preserved
- Ability to review exact changes
- Enhanced audit capability

### 🧠 Decision Logging

Explicit documentation of development decisions:

- Decision descriptions
- Detailed reasoning
- Alternative approaches considered

### 📊 Data Persistence

All data is stored in a Supabase database with a structured schema:

- Application, feature, and task information
- Session metadata and context
- File changes and content snapshots
- Checkpoint documentation
- Decision records

## MCP Tools

TaskFlow provides a comprehensive set of MCP tools to enforce structure:

### Core Tools

| Tool | Description |
|------|-------------|
| `initialize-assistant` | Starts a new session with proper context and hierarchy awareness |
| `record-file-change` | Tracks file modifications with session association |
| `create-progress-checkpoint` | Documents progress at regular intervals |
| `create-snapshot` | Captures file contents at specific points in time |
| `log-decision` | Records key development decisions with reasoning |

### Navigation Tools

| Tool | Description |
|------|-------------|
| `get-applications` | Retrieves available applications in the system |
| `get-features` | Lists features for a specific application |
| `get-tasks` | Gets tasks within a feature |
| `get-session-history` | Retrieves historical sessions for a task |
| `end-session` | Properly closes an active session |

## Tool Details

### initialize-assistant

```typescript
server.tool(
  "initialize-assistant",
  "Initialize the assistant for a specific task type.",
  {
    taskType: z.enum(["code-editing", "planning", "research", "exploration"]),
    contextDescription: z.string().optional(),
    applicationId: z.string().optional(),
    featureId: z.string().optional(),
    taskId: z.string().optional(),
  },
  async (args) => {
    // Creates session and returns context information
  }
);
```

### record-file-change

```typescript
server.tool(
  "record-file-change",
  "Record a file system change.",
  {
    sessionId: z.string(),
    filePath: z.string(),
    changeType: z.enum(["created", "modified", "deleted"]),
  },
  async (args) => {
    // Records file change in database
  }
);
```

### create-progress-checkpoint

```typescript
server.tool(
  "create-progress-checkpoint",
  "Create a checkpoint to document progress.",
  {
    sessionId: z.string(),
    progress: z.string(),
    changesDescription: z.string(),
    currentThinking: z.string(),
    nextSteps: z.string().optional(),
  },
  async (args) => {
    // Creates progress checkpoint
  }
);
```

### create-snapshot

```typescript
server.tool(
  "create-snapshot",
  "Create a content snapshot of a file.",
  {
    sessionId: z.string(),
    filePath: z.string(),
    content: z.string(),
  },
  async (args) => {
    // Saves file content snapshot
  }
);
```

### log-decision

```typescript
server.tool(
  "log-decision",
  "Log a key decision made during development.",
  {
    sessionId: z.string(),
    description: z.string(),
    reasoning: z.string(),
    alternatives: z.string().optional(),
  },
  async (args) => {
    // Records development decision
  }
);
```

## Why It Works

TaskFlow takes advantage of a key insight: **AI assistants will follow clear, consistent instructions in tool responses**. Rather than trying to "control" the AI through prompting alone, TaskFlow adds structural constraints by:

1. **Requiring initialization** - Creating a clear session start with hierarchical context
2. **Enforcing documentation** - Mandatory tracking of file changes and decisions
3. **Demanding checkpoints** - Regular progress summaries
4. **Content preservation** - Capturing actual file states through snapshots
5. **Hierarchical structure** - Constraining work within well-defined tasks
6. **Persistent reminders** - Each tool response reinforces proper workflow

## Getting Started

### Prerequisites

- Node.js v16+
- Supabase account (local or cloud)
- An MCP client like Cursor or any other Model Context Protocol compatible editor

### Installation

```bash
# Clone the repository
git clone https://github.com/stumason/taskflow.git

# Install dependencies
cd taskflow
npm install

# Set up Supabase (local)
npx supabase init
npx supabase start

# Apply migrations
npx supabase db reset

# Start the server
npm start
```

### Connecting to an MCP client

TaskFlow uses the standard MCP STDIO interface. In Cursor, you can configure it by:

1. Open Settings
2. Navigate to AI > Advanced
3. Set "Model Context Protocol Server" to the path of your TaskFlow server.js
4. Restart Cursor

## Database Schema

TaskFlow uses a relational database with the following core tables:

- `applications` - Top-level software products
- `features` - Major functionality groups
- `tasks` - Specific work items
- `sessions` - AI working periods
- `file_changes` - Record of file modifications
- `checkpoints` - Progress documentation
- `snapshots` - File content captures
- `decisions` - Development decision records

## Roadmap

TaskFlow is under active development. Future enhancements include:

- [x] **Hierarchical Data Model** - Application > Feature > Task structure
- [x] **Enhanced Session Context** - Task awareness and history
- [x] **Content Snapshots** - Point-in-time file content preservation
- [x] **Decision Logging** - Explicit documentation of development choices
- [ ] **Web Dashboard** - Visual reporting of sessions and changes
- [ ] **User Feedback Integration** - Allow explicit approval/rejection of changes
- [ ] **Git Integration** - Associate sessions with commits
- [ ] **Multi-Agent Support** - Coordinated workflows across multiple AI agents
- [ ] **Task Templates** - Pre-defined structured workflows for common tasks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

TaskFlow was created to make AI-assisted coding more predictable, transparent, and effective. By adding structure to the chaotic world of "vibe coding," it aims to enhance rather than restrict the powerful capabilities of modern AI coding assistants.