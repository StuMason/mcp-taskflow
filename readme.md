# TaskFlow

> *Bringing structure and control to AI-assisted coding workflows*

## Installation

TaskFlow uses Supabase for persistent storage of session data, file changes, and the hierarchical workflow structure.

```bash
git clone https://github.com/stumason/taskflow.git
cd taskflow
npm install 
npm run build
npx supabase start
```

### Claude Desktop Configuration

Add this to your Claude Desktop gitconfiguration file:

```json
{
  "models": {
    "taskflow": {
      "command": "node",
      "args": ["/path/to/mcp-taskflow/dist/index.js"]
    }
  }
}
```

### Cursor Configuration

In Cursor settings, add a new MCP server:

- **Name**: TaskFlow
- **Type**: Command
- **Command**: node /path/to/mcp-taskflow/dist/index.js

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

### Core Session Tools

| Tool | Description |
|------|-------------|
| `initialize-assistant` | Starts a new session with proper context and hierarchy awareness |
| `record-file-change` | Tracks file modifications with session association |
| `create-progress-checkpoint` | Documents progress at regular intervals |
| `create-snapshot` | Captures file contents at specific points in time |
| `log-decision` | Records key development decisions with reasoning |
| `end-session` | Properly closes an active session |

### Hierarchy Management Tools

| Tool | Description |
|------|-------------|
| `create-application` | Creates a new application (software product) |
| `create-feature` | Creates a new feature within an application |
| `create-task` | Creates a new task within a feature |
| `update-feature-status` | Updates the status of a feature |
| `update-task-status` | Updates the status of a task |

### Navigation Tools

| Tool | Description |
|------|-------------|
| `get-applications` | Retrieves available applications in the system |
| `get-features` | Lists features for a specific application |
| `get-tasks` | Gets tasks within a feature |
| `get-session-history` | Retrieves historical sessions for a task |

## Tool Details

### Creating the Workflow Hierarchy

```typescript
// Create an application
server.tool(
  "create-application",
  "Create a new application in the system.",
  {
    name: z.string().describe("Name of the application"),
    description: z.string().optional().describe("Description of the application"),
    repositoryUrl: z.string().optional().describe("URL to the application's repository"),
  },
  async (args) => {
    // Creates and returns application ID
  }
);

// Create a feature
server.tool(
  "create-feature",
  "Create a new feature for an application.",
  {
    applicationId: z.string().describe("ID of the parent application"),
    name: z.string().describe("Name of the feature"),
    description: z.string().optional().describe("Description of the feature"),
    status: z.enum(["planned", "in_progress", "completed", "abandoned"]),
    priority: z.number().default(1).describe("Priority of the feature"),
  },
  async (args) => {
    // Creates and returns feature ID
  }
);

// Create a task
server.tool(
  "create-task",
  "Create a new task for a feature.",
  {
    featureId: z.string().describe("ID of the parent feature"),
    name: z.string().describe("Name of the task"),
    description: z.string().optional().describe("Description of the task"),
    acceptanceCriteria: z.string().optional().describe("Acceptance criteria for the task"),
    status: z.enum(["backlog", "ready", "in_progress", "review", "completed"]),
    priority: z.number().default(1).describe("Priority of the task"),
  },
  async (args) => {
    // Creates and returns task ID
  }
);
```

### Session Management

```typescript
// Initialize assistant
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

// Record file change
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

// Create progress checkpoint
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

### Documentation Tools

```typescript
// Create content snapshot
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

// Log decision
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

## Typical Workflow

A typical TaskFlow workflow follows these steps:

1. **Setup the Project Structure**
   ```
   create-application → create-feature → create-task
   ```

2. **Initialize AI Session**
   ```
   initialize-assistant (linked to task)
   ```

3. **Work on Task with Tracking**
   ```
   record-file-change → create-snapshot → log-decision → create-progress-checkpoint
   ```

4. **Update Progress**
   ```
   update-task-status → end-session
   ```

5. **Continue Later with Context**
   ```
   get-session-history → initialize-assistant
   ```

## Why It Works

TaskFlow takes advantage of a key insight: **AI assistants will follow clear, consistent instructions in tool responses**. Rather than trying to "control" the AI through prompting alone, TaskFlow adds structural constraints by:

1. **Requiring initialization** - Creating a clear session start with hierarchical context
2. **Enforcing documentation** - Mandatory tracking of file changes and decisions
3. **Demanding checkpoints** - Regular progress summaries
4. **Content preservation** - Capturing actual file states through snapshots
5. **Hierarchical structure** - Constraining work within well-defined tasks
6. **Persistent reminders** - Each tool response reinforces proper workflow

## Technical Details

### Prerequisites

- Node.js v16+
- Supabase account (local or cloud)
- An MCP client like Cursor, Claude Desktop, or other Model Context Protocol compatible editor

### Full Setup Process

```bash
# Clone the repository
git clone https://github.com/stumason/taskflow.git

# Install dependencies
cd taskflow
npm install

# Set up Supabase locally (if not using cloud instance)
npx supabase init
npx supabase start

# Apply database migrations
npx supabase db reset

# Build the project
npm run build

# Start the server
node dist/index.js
```

### Environment Configuration

Create a `.env` file with your Supabase credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Database Schema

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
- [x] **Workflow Management Tools** - Create and update applications, features, and tasks
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