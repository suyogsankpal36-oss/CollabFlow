import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CollabFlow database seed...');

  // 1. Clean existing database
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create realistic users
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@collabflow.dev',
      name: 'Alex Rivera (Staff Lead)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'sarah.chen@collabflow.dev',
      name: 'Sarah Chen (Backend)',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      role: 'MEMBER',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'marcus.vance@collabflow.dev',
      name: 'Marcus Vance (DevOps/SRE)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      role: 'MEMBER',
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'elena.rostova@collabflow.dev',
      name: 'Elena Rostova (UI/UX)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      passwordHash,
      role: 'MEMBER',
    },
  });

  console.log('✅ Created users');

  // 4. Create Main Engineering Board
  const board = await prisma.board.create({
    data: {
      title: 'CollabFlow Core Engineering',
      description: 'Sprint 24: Real-time synchronization, zero-latency drag & drop, and enterprise security hardening.',
      ownerId: demoUser.id,
    },
  });

  console.log(`✅ Created board: ${board.title}`);

  // 5. Create 4 Kanban Columns
  const colBacklog = await prisma.column.create({
    data: {
      boardId: board.id,
      title: 'Backlog',
      order: 0,
      color: '#64748b', // Slate
    },
  });

  const colInProgress = await prisma.column.create({
    data: {
      boardId: board.id,
      title: 'In Progress',
      order: 1,
      color: '#3b82f6', // Blue
    },
  });

  const colInReview = await prisma.column.create({
    data: {
      boardId: board.id,
      title: 'In Review',
      order: 2,
      color: '#f59e0b', // Amber
    },
  });

  const colDone = await prisma.column.create({
    data: {
      boardId: board.id,
      title: 'Completed',
      order: 3,
      color: '#10b981', // Emerald
    },
  });

  console.log('✅ Created columns');

  // Helper date function
  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // 6. Create 12 realistic engineering tasks
  const tasksData = [
    // Column 0: Backlog
    {
      columnId: colBacklog.id,
      boardId: board.id,
      title: 'Implement OAuth2 Refresh Token Rotation & Session Revocation',
      description: `### Goal
Mitigate stolen token replay attacks by implementing refresh token rotation with single-use guarantees and device fingerprint binding.

#### Technical Requirements
- [x] Create Redis key-value store for active session families
- [ ] Invalidate entire refresh family on replay detection
- [ ] Add \`/api/auth/revoke-all\` endpoint for user security settings
- [ ] Add audit logging for security alerts`,
      priority: 'HIGH',
      order: 0,
      dueDate: daysFromNow(7),
      assigneeId: member1.id,
      tags: JSON.stringify(['Security', 'Auth', 'Backend']),
      subtasks: JSON.stringify([
        { id: 'st-1', title: 'Create Redis session family store', completed: true },
        { id: 'st-2', title: 'Implement replay detection middleware', completed: false },
        { id: 'st-3', title: 'Add session revocation endpoints', completed: false },
      ]),
    },
    {
      columnId: colBacklog.id,
      boardId: board.id,
      title: 'Configure Multi-Stage Dockerfile for Distroless Production Build',
      description: `### Summary
Reduce Docker container image footprint from ~950MB to <80MB using Google Distroless Node.js image with minimal runtime surface.

### Acceptance Criteria
- Multi-stage build with prune step
- Non-root user execution (\`USER nonroot\`)
- Verify healthcheck endpoint runs under 200ms`,
      priority: 'MEDIUM',
      order: 1,
      dueDate: daysFromNow(12),
      assigneeId: member2.id,
      tags: JSON.stringify(['DevOps', 'Docker', 'Infra']),
      subtasks: JSON.stringify([
        { id: 'st-4', title: 'Draft multi-stage Dockerfile', completed: false },
        { id: 'st-5', title: 'Run Trivy security scan on image', completed: false },
      ]),
    },
    {
      columnId: colBacklog.id,
      boardId: board.id,
      title: 'Audit Database Query Performance & Connection Pool Tuning',
      description: `### Scope
Investigate p99 latency spikes during batch task reordering. Add compound indexes on \`tasks(boardId, columnId, order)\`.`,
      priority: 'LOW',
      order: 2,
      dueDate: daysFromNow(14),
      assigneeId: member1.id,
      tags: JSON.stringify(['Database', 'Prisma', 'Performance']),
      subtasks: JSON.stringify([
        { id: 'st-6', title: 'Analyze slow query logs', completed: false },
        { id: 'st-7', title: 'Benchmark pgBouncer pool limits', completed: false },
      ]),
    },

    // Column 1: In Progress
    {
      columnId: colInProgress.id,
      boardId: board.id,
      title: 'Optimize PostgreSQL Indexes on PingLog & Audit Events',
      description: `### Context
High-throughput activity logs have grown to 1.2M rows. Queries on \`boardId + createdAt\` require index scan optimizations.

\`\`\`sql
CREATE INDEX CONCURRENTLY idx_activity_board_created 
ON "ActivityLog" ("boardId", "createdAt" DESC);
\`\`\`

#### Verification
- EXPLAIN ANALYZE cost drops by >85%
- Zero downtime index creation applied via Prisma migration`,
      priority: 'URGENT',
      order: 0,
      dueDate: daysFromNow(2),
      assigneeId: demoUser.id,
      tags: JSON.stringify(['Postgres', 'SQL', 'Database']),
      subtasks: JSON.stringify([
        { id: 'st-8', title: 'Generate migration script', completed: true },
        { id: 'st-9', title: 'Test on staging database replica', completed: true },
        { id: 'st-10', title: 'Verify EXPLAIN ANALYZE metrics', completed: false },
      ]),
    },
    {
      columnId: colInProgress.id,
      boardId: board.id,
      title: 'Add WebSocket Reconnection Backoff & State Reconciliation',
      description: `### Objectives
Ensure resilient Socket.io connection in spotty network conditions (mobile hotspots, sleeping laptops).

- Exponential backoff with jitter (initial 500ms, max 10s)
- Delta sync upon reconnection to pull miss-window changes
- Heartbeat indicator in top navbar showing connection latency`,
      priority: 'HIGH',
      order: 1,
      dueDate: daysFromNow(3),
      assigneeId: demoUser.id,
      tags: JSON.stringify(['WebSockets', 'RealTime', 'Frontend']),
      subtasks: JSON.stringify([
        { id: 'st-11', title: 'Configure client exponential backoff', completed: true },
        { id: 'st-12', title: 'Implement missed-events replay buffer', completed: false },
        { id: 'st-13', title: 'Add connection ping latency tooltip', completed: true },
      ]),
    },
    {
      columnId: colInProgress.id,
      boardId: board.id,
      title: 'Implement Client-Side Optimistic UI Rollback for Kanban DnD',
      description: `### Description
When a user drags a task between columns, update the local Zustand store immediately (0ms visual lag). If the HTTP/WebSocket request returns an error:
1. Revert the task to its previous column and order
2. Fire a toast notification with a Retry action`,
      priority: 'URGENT',
      order: 2,
      dueDate: daysFromNow(1),
      assigneeId: demoUser.id,
      tags: JSON.stringify(['React', 'Zustand', 'UX']),
      subtasks: JSON.stringify([
        { id: 'st-14', title: 'Capture snapshot state before move', completed: true },
        { id: 'st-15', title: 'Handle network timeout rollback', completed: true },
        { id: 'st-16', title: 'Test concurrent drag conflict resolution', completed: false },
      ]),
    },

    // Column 2: In Review
    {
      columnId: colInReview.id,
      boardId: board.id,
      title: 'Design Dark Mode Design Token System with Tailwind CSS',
      description: `### Overview
Refactor the color palette to use semantic CSS variables mapped to Tailwind \`zinc\` and \`slate\` shades with high contrast borders (\`zinc-800/80\`) and glassmorphic backdrop filters.

- Contrast ratio AAA on text elements
- Subtle card hover glow effect
- Consistent status badge color semantics across light & dark`,
      priority: 'HIGH',
      order: 0,
      dueDate: daysFromNow(4),
      assigneeId: member3.id,
      tags: JSON.stringify(['UI/UX', 'Tailwind', 'DesignSystem']),
      subtasks: JSON.stringify([
        { id: 'st-17', title: 'Define semantic CSS variables', completed: true },
        { id: 'st-18', title: 'Audit all modal and popover surfaces', completed: true },
        { id: 'st-19', title: 'Get design signoff on contrast ratios', completed: true },
      ]),
    },
    {
      columnId: colInReview.id,
      boardId: board.id,
      title: 'Refactor Task Detail Modal with Markdown Live Preview',
      description: `### Features Added
- Split/tabbed view between Raw Markdown and formatted HTML preview
- Support for code blocks, checkboxes, tables, and blockquotes
- Auto-save on blur or debounce keystrokes (400ms)`,
      priority: 'MEDIUM',
      order: 1,
      dueDate: daysFromNow(5),
      assigneeId: demoUser.id,
      tags: JSON.stringify(['Markdown', 'Frontend', 'React']),
      subtasks: JSON.stringify([
        { id: 'st-20', title: 'Integrate markdown parser', completed: true },
        { id: 'st-21', title: 'Implement edit/preview toggle', completed: true },
        { id: 'st-22', title: 'Add keyboard shortcut (Ctrl+E) to edit', completed: true },
      ]),
    },
    {
      columnId: colInReview.id,
      boardId: board.id,
      title: 'Add Rate Limiting & Helmet Security Headers on Express Routes',
      description: `### Security Enhancements
- \`express-rate-limit\` set to 100 requests / min per IP on API routes
- Stricter limit (10 / min) on \`/api/auth/login\` and \`/api/auth/register\`
- Content Security Policy (CSP) & HSTS header compliance`,
      priority: 'HIGH',
      order: 2,
      dueDate: daysFromNow(6),
      assigneeId: member1.id,
      tags: JSON.stringify(['Security', 'Express', 'API']),
      subtasks: JSON.stringify([
        { id: 'st-23', title: 'Configure helmet middleware', completed: true },
        { id: 'st-24', title: 'Add sliding window rate limiter', completed: true },
        { id: 'st-25', title: 'Verify CORS preflight handling', completed: true },
      ]),
    },

    // Column 3: Done
    {
      columnId: colDone.id,
      boardId: board.id,
      title: 'Implement Cmd+K Global Quick Search and Command Palette',
      description: `### Shipped Feature
Instant global command palette accessible anywhere via \`Cmd+K\` or \`Ctrl+K\`.
- Real-time search across task titles and tags
- Quick action navigation (Create Task, Toggle Theme, Filter Board)
- Keyboard arrow navigation and instant modal trigger`,
      priority: 'MEDIUM',
      order: 0,
      dueDate: daysFromNow(-2),
      assigneeId: demoUser.id,
      tags: JSON.stringify(['Keyboard', 'UX', 'CommandPalette']),
      subtasks: JSON.stringify([
        { id: 'st-26', title: 'Build modal trigger & keyboard listeners', completed: true },
        { id: 'st-27', title: 'Implement fuzzy search filter', completed: true },
        { id: 'st-28', title: 'Add quick action commands', completed: true },
      ]),
    },
    {
      columnId: colDone.id,
      boardId: board.id,
      title: 'Add Subtask Checklist & Dynamic Progress Bar Calculation',
      description: `### Shipped Feature
Added interactive subtask checklists to cards and detail modals with live percentage completion indicators and real-time multiplayer updates.`,
      priority: 'LOW',
      order: 1,
      dueDate: daysFromNow(-4),
      assigneeId: member3.id,
      tags: JSON.stringify(['Features', 'Components']),
      subtasks: JSON.stringify([
        { id: 'st-29', title: 'Subtask schema and CRUD endpoints', completed: true },
        { id: 'st-30', title: 'Animated progress bar component', completed: true },
      ]),
    },
    {
      columnId: colDone.id,
      boardId: board.id,
      title: 'Set Up CI/CD Pipeline on GitHub Actions for Automated Linting & E2E',
      description: `### Shipped Feature
Automated GitHub Actions workflow triggering on pull requests:
- TypeScript type checking (\`tsc --noEmit\`)
- ESLint and Prettier formatting checks
- Prisma migration verification`,
      priority: 'MEDIUM',
      order: 2,
      dueDate: daysFromNow(-5),
      assigneeId: member2.id,
      tags: JSON.stringify(['CI/CD', 'GitHubActions', 'DevOps']),
      subtasks: JSON.stringify([
        { id: 'st-31', title: 'Write PR check workflow yaml', completed: true },
        { id: 'st-32', title: 'Cache npm dependencies for speed', completed: true },
      ]),
    },
  ];

  const createdTasks = [];
  for (const t of tasksData) {
    const task = await prisma.task.create({ data: t });
    createdTasks.push(task);
  }
  console.log(`✅ Created ${createdTasks.length} realistic tasks`);

  // 7. Create realistic Activity Log entries
  const activities = [
    {
      boardId: board.id,
      userId: demoUser.id,
      action: 'created the board "CollabFlow Core Engineering"',
      createdAt: daysFromNow(-10),
    },
    {
      boardId: board.id,
      taskId: createdTasks[9].id,
      userId: demoUser.id,
      action: `moved task "${createdTasks[9].title}" to Completed`,
      createdAt: daysFromNow(-2),
    },
    {
      boardId: board.id,
      taskId: createdTasks[10].id,
      userId: member3.id,
      action: `completed all subtasks on "${createdTasks[10].title}"`,
      createdAt: daysFromNow(-3),
    },
    {
      boardId: board.id,
      taskId: createdTasks[3].id,
      userId: demoUser.id,
      action: `changed priority of "${createdTasks[3].title}" to URGENT`,
      createdAt: daysFromNow(-1),
    },
    {
      boardId: board.id,
      taskId: createdTasks[4].id,
      userId: member1.id,
      action: `assigned "${createdTasks[4].title}" to Alex Rivera`,
      createdAt: new Date(),
    },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }

  console.log('✅ Created activity logs');
  console.log('🎉 Database seeding complete!');
  console.log('----------------------------------------------------');
  console.log('👤 Demo Account: demo@collabflow.dev / password123');
  console.log('📋 Board ID:', board.id);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
