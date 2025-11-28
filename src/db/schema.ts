import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

export const rolesEnum = ['super_admin', 'manager', 'project_manager', 'supervisor', 'staff'] as const;

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  password: text('password'),
  roles: text('roles', { mode: 'json' }).$type<string[]>().notNull().default(['staff']),
  // role: text('role', { enum: rolesEnum }).default('staff'), // Deprecated
  fullName: text('full_name'), // Keeping for backward compatibility or mapping to name
  avatarUrl: text('avatar_url'), // Keeping for backward compatibility or mapping to image
  createdAt: text('created_at'),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

// Clients table
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(), // Using text for UUID compatibility
  companyName: text('company_name').notNull(),
  contactPersonName: text('contact_person_name'),
  contactEmail: text('contact_email'),
  websiteUrl: text('website_url'),
  createdAt: text('created_at'),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  status: text("status", { enum: ["task", "in_progress", "completed"] })
    .notNull()
    .default("task"),
  // assigneeId: text("assignee_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const decisions = sqliteTable('decisions', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  dueDate: text('due_date'),
});

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey(),
  // Core content
  title: text('title').notNull(),
  content: text('content').notNull(),

  // Classification & organization
  type: text('type', { enum: ['note', 'checklist', 'todo', 'journal', 'meeting', 'idea', 'link', 'code', 'bookmark', 'sketch'] })
    .notNull()
    .default('note'),
  tags: text('tags'), // JSON string array
  notebook: text('notebook'), // e.g., workspace/folder name
  color: text('color'), // hex or token

  // State flags
  isPinned: integer('is_pinned').default(0), // 0=false, 1=true
  isArchived: integer('is_archived').default(0),
  isFavorite: integer('is_favorite').default(0),

  // Media & relations
  coverImage: text('cover_image'), // URL
  links: text('links'), // JSON string array of URLs
  attachments: text('attachments'), // JSON string array of file metadata

  // Time-based metadata
  reminderAt: text('reminder_at'), // ISO datetime
  dueDate: text('due_date'), // ISO date for tasks/todos type
  priority: text('priority', { enum: ['low', 'medium', 'high'] }),

  // Audit
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  userId: text('user_id').references(() => users.id),
});

export const noteShares = sqliteTable('note_shares', {
  id: integer('id').primaryKey(),
  noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // Optional: if sharing with existing user
  email: text('email').notNull(), // For sharing via email
  permission: text('permission', { enum: ['view', 'edit'] }).default('view'),
  createdAt: text('created_at'),
}, (table) => ({
  uniqueNoteEmail: unique().on(table.noteId, table.email),
}));

// Calendar events
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  start: text('start').notNull(), // ISO string
  end: text('end').notNull(),     // ISO string
  allDay: integer('all_day').default(0),
  location: text('location'),
  organizer: text('organizer'),
  attendees: text('attendees'), // JSON string array
  status: text('status', { enum: ['tentative','confirmed','cancelled'] }),
  privacy: text('privacy', { enum: ['public','private','confidential'] }),
  recurrence: text('recurrence'),
  reminders: text('reminders'),
  color: text('color'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").unique(), // e.g. "PROJ-123"
  description: text("description"),
  status: text("status", { enum: ["planning", "in_progress", "completed", "on_hold"] })
    .notNull()
    .default("planning"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  tags: text("tags"), // JSON string array

  // Foreign Keys - references to users and clients
  ownerId: text("owner_id").references(() => users.id),
  // managerId: text("manager_id").references(() => users.id),
  clientId: text("client_id").references(() => clients.id),

  // Timeline
  startDate: text("start_date"), // ISO Date
  endDate: text("end_date"),     // ISO Date (Scheduled Deadline)

  // Financials
  budget: integer("budget"),
  spent: integer("spent").default(0),
  currency: text("currency").default("USD"),
  billingType: text("billing_type", { enum: ["time_and_materials", "fixed_price", "non_billable"] }).default("non_billable"),

  // Meta & Audit
  isArchived: integer("is_archived").default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

// Join Tables
export const projectManagers = sqliteTable('project_managers', {
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.userId] }),
}));

export const taskAssignees = sqliteTable('task_assignees', {
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.userId] }),
}));

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects, { relationName: 'owner' }),
  // managedProjects: many(projects, { relationName: 'manager' }), // Deprecated
  assignedTasks: many(tasks, { relationName: 'assignee' }), // Deprecated direct relation
  projectManagers: many(projectManagers),
  taskAssignees: many(taskAssignees),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: 'owner',
  }),
  // manager: one(users, {
  //   fields: [projects.managerId],
  //   references: [users.id],
  //   relationName: 'manager',
  // }),
  managers: many(projectManagers),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  // assignee: one(users, {
  //   fields: [tasks.assigneeId],
  //   references: [users.id],
  //   relationName: 'assignee',
  // }),
  assignees: many(taskAssignees),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const projectManagersRelations = relations(projectManagers, ({ one }) => ({
  project: one(projects, { fields: [projectManagers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectManagers.userId], references: [users.id] }),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAssignees.userId], references: [users.id] }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  owner: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  shares: many(noteShares),
}));

export const noteSharesRelations = relations(noteShares, ({ one }) => ({
  note: one(notes, {
    fields: [noteShares.noteId],
    references: [notes.id],
  }),
  user: one(users, {
    fields: [noteShares.userId],
    references: [users.id],
  }),
}));
