# TaskFlow

> *The Future of Development Workflows: AI-Powered Kanban for the Modern Era*

## What is TaskFlow?

TaskFlow is a revolutionary workflow management system that brings structure, accountability, and visibility to AI-assisted coding. It reimagines Kanban for the AI era, creating a visual, flow-based development environment where AI assistants move systematically through work stages while documenting their thought process at every step.

Unlike traditional approaches that try to limit AI capabilities, TaskFlow enhances them by adding intuitive process visualization and tracking that makes AI development predictable, traceable, and collaborative.

## The Problem

Current AI assistant coding workflows are chaotic. While tools like Cursor, Windsurf, and other Model Context Protocol (MCP) clients unlock powerful AI pair programming capabilities, they frequently suffer from critical issues:

- 🧠 **Context amnesia** - Models forget what they were working on
- 🔄 **Unfocused changes** - Files modified with no clear task boundaries
- 🌊 **Workflow turbulence** - No checkpointing or progress tracking
- 🚧 **Lack of transparency** - Difficult to audit what changed and why

## The Solution: Visual Workflow Management for AI Development

TaskFlow creates a streamlined environment where AI assistants:

1. Work within a natural project hierarchy (Applications → Features → Tasks)
2. Follow a visual Kanban workflow with clear status transitions
3. Document their reasoning and decision-making in real-time
4. Track all file changes with rich contextual information
5. Create continuous progress checkpoints to visualize development flow
6. Maintain snapshots of important file states as they evolve

```
      ┌───────────────┐      ┌───────────────┐
User ─┤ MCP Client    │──────┤ TaskFlow      │──── AI Assistant
      │ (e.g. Cursor) │      │ Server        │     Following
      └───────────────┘      └───────────────┘     Visual Workflow
                                    │
                                    ▼
                           ┌─────────────────────┐
                           │  Visual Flow-Based  │
                           │  Workflow Tracking  │
                           └─────────────────────┘
```

## How It Works: Visual Flow-Based Development

TaskFlow's workflow model establishes a clear visual progression that mirrors how modern development teams operate:

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

This structure enables AI assistants to:
- Visualize their place in the development workflow
- Maintain awareness of task boundaries and progress
- Track the context of their changes like a storyboard
- Document decisions and progress visually

## Key Features

### ✅ Visual Session Flow

Every AI working session is visualized as a flow of activities:

- Task type (code-editing, planning, research, etc.)
- Context description
- Session tracking and visualization
- Links to project hierarchy components
- Historical context from previous sessions

### 📝 Visual Change Tracking

File operations are captured in a visual timeline:

- Created, modified, or deleted files shown in sequence
- Visual association with sessions and decisions
- Historical file change visualization

### 🔄 Visual Progress Tracking

Development progress is visually mapped through checkpoints:

- Progress visualization with clear milestone markers
- Change visualization through development stages
- Thought process mapping and visualization
- Next steps visualization for continuity

### 📸 Visual State Snapshots

Key development states are preserved visually:

- Complete file contents preserved at critical points
- Visual comparison between development states
- Enhanced visual auditing capability

### 🧠 Decision Flow Visualization

Development decisions are mapped in a visual flow:

- Decision points clearly marked in the development timeline
- Visual reasoning maps for key decisions
- Alternative approaches visually compared

### 📊 Visual Workflow Analytics

All workflow data is visualized through powerful analytics:

- Application, feature, and task progression visualization
- Session activity heatmaps and flow diagrams
- File change visualization across time
- Decision visualization with impact analysis

## MCP Tools

TaskFlow provides a comprehensive set of MCP tools to enforce and visualize structure:

### Core Session Visualization Tools

| Tool | Description |
|------|-------------|
| `MUST-INITIALIZE-SESSION` | Starts a new session with proper context and visual flow tracking |
| `MUST-RECORD-EVERY-FILE-CHANGE` | Adds file modifications to the visual development timeline |
| `REQUIRED-PROGRESS-CHECKPOINT` | Documents progress markers in the visual workflow |
| `MUST-SNAPSHOT-KEY-STATES` | Captures visual snapshots of file contents at milestone points |
| `MUST-LOG-ALL-DECISIONS` | Maps key development decisions in the visual decision flow |
| `MUST-END-SESSION-PROPERLY` | Properly closes and summarizes a visual workflow session |

### Visual Workflow Management Tools

| Tool | Description |
|------|-------------|
| `MUST-CREATE-APPLICATION-FIRST` | Creates a new top-level workflow container |
| `MUST-CREATE-FEATURE-PROPERLY` | Creates a new feature workflow within an application |
| `MUST-CREATE-TASK-PROPERLY` | Creates a new task workflow within a feature |
| `MUST-UPDATE-FEATURE-STATUS` | Updates the visual status of a feature in the workflow |
| `MUST-UPDATE-TASK-STATUS` | Updates the visual status of a task in the Kanban flow |

### Workflow Navigation Tools

| Tool | Description |
|------|-------------|
| `MUST-GET-APPLICATIONS` | Retrieves available workflow applications |
| `MUST-GET-FEATURES` | Lists features in the workflow hierarchy |
| `MUST-GET-TASKS` | Gets tasks within the workflow visualization |
| `MUST-GET-SESSION-HISTORY` | Retrieves the visual timeline of historical sessions |

## Typical Workflow

A typical TaskFlow visualization follows these steps:

1. **Setup the Visual Workflow Structure**
   ```
   MUST-CREATE-APPLICATION-FIRST → MUST-CREATE-FEATURE-PROPERLY → MUST-CREATE-TASK-PROPERLY
   ```

2. **Initialize AI Session in the Visual Flow**
   ```
   MUST-INITIALIZE-SESSION (linked to task)
   ```

3. **Work on Task with Visual Tracking**
   ```
   MUST-RECORD-EVERY-FILE-CHANGE → MUST-SNAPSHOT-KEY-STATES → MUST-LOG-ALL-DECISIONS → REQUIRED-PROGRESS-CHECKPOINT
   ```

4. **Update Visual Progress**
   ```
   MUST-UPDATE-TASK-STATUS → MUST-END-SESSION-PROPERLY
   ```

5. **Continue Visual Flow Later**
   ```
   MUST-GET-SESSION-HISTORY → MUST-INITIALIZE-SESSION
   ```

## Why It Works

TaskFlow leverages visual workflow principles that have revolutionized modern development teams:

1. **Visual initialization** - Creating a clear visual start to each work session
2. **Visual documentation** - Mapping all changes within a visual timeline
3. **Visual checkpoints** - Regular progress visualization across time
4. **Visual snapshots** - Capturing development states for comparison
5. **Visual hierarchy** - Constraining work within a clear visual structure
6. **Visual feedback** - Each tool response reinforces the visual workflow

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

- `applications` - Top-level workflow containers
- `features` - Functional workflow groups
- `tasks` - Specific work items in the flow
- `sessions` - AI working periods within the flow
- `file_changes` - Record of file modifications in the timeline
- `checkpoints` - Progress markers in the workflow
- `snapshots` - Development state captures
- `decisions` - Decision points within the flow

## Roadmap

TaskFlow is under active development. Future enhancements include:

- [x] **Visual Workflow Hierarchy** - Application > Feature > Task structure
- [x] **Enhanced Flow Context** - Task awareness and history
- [x] **Visual State Preservation** - Point-in-time content visualization
- [x] **Decision Flow Mapping** - Explicit documentation of development choices
- [x] **Workflow Management Tools** - Create and update applications, features, and tasks
- [ ] **Visual Flow Dashboard** - Beautiful reporting of sessions and changes
- [ ] **User Feedback Integration** - Allow explicit approval/rejection within the flow
- [ ] **Git Integration** - Associate workflow sessions with commits
- [ ] **Multi-Agent Flow** - Coordinated workflows across multiple AI agents
- [ ] **Flow Templates** - Pre-defined structured workflows for common tasks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

TaskFlow was created to bring visual, flow-based development principles to AI-assisted coding. By adding structure to the chaotic world of "vibe coding," it aims to enhance rather than restrict the powerful capabilities of modern AI coding assistants.