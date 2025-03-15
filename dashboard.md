TaskFlow Dashboard Development Prompt

You are tasked with implementing a modern, Kanban-inspired dashboard for the TaskFlow system. TaskFlow is an innovative MCP server that provides structure and transparency to AI-assisted coding workflows through a hierarchical project management system (Applications → Features → Tasks) and enforced documentation.

Project Context
TaskFlow already has:

A backend server using Supabase for data storage
A complete hierarchical data model (Applications, Features, Tasks, Sessions, etc.)
MCP tools for enforcing workflow structure

What's needed now is a NextJS dashboard application that visualizes this data in an intuitive, Kanban-style interface.
Your Tasks

First, examine the existing TaskFlow codebase, with particular attention to:

Database schema and relationships
Available data in Supabase
Authentication methods used (if any)


Then, continue with the half installed NextJs Application in the ./dashboard directory:

It's congigured with TypeScript and Tailwind CSS
Set up Supabase client connection to access the TaskFlow database
Leave a authentication system out for now, we will come back to this

Using the TaskFlow organization model, create appropriate Features and Tasks in a logical progression for dashboard development

Implement core views:

Applications overview (card grid showing applications and their metrics)
Feature Kanban board (columns for feature statuses)
Task Kanban board (Trello-style interface for tasks)
Session timeline view (chronological view of AI sessions)

Implement detailed views:

File change explorer (timeline of file modifications)
Decision log (searchable table of AI decisions)
Checkpoint flow (visual representation of progress)
Compliance dashboard (metrics on model behavior)

Technical Requirements

Use React Query for data fetching and caching
Implement Supabase realtime subscriptions for live updates
Create reusable UI components for dashboard elements
Use lightweight charting libraries (recharts/visx) for visualizations
Ensure responsive design for all screen sizes
Focus on performance with proper data pagination and lazy loading

Design Philosophy
The dashboard should embody visual workflow principles:

Clean, modern interface inspired by popular Kanban tools
Visual status transitions and progress indicators
Color coding for different states and priorities
Intuitive navigation between different levels of the hierarchy
Emphasis on timeline visualization for tracking AI activity

Implementation Approach
Start by creating the Supabase connection. Then implement the core views one by one, starting with the Applications overview and progressing to more detailed views. Use the TaskFlow data model to guide your implementation, and create reusable components that can be composed into different views.

Test the application by running it locally and ensuring it connects to the Supabase database.