import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email'),
  password: text('password').notNull(),
  role: text('role', { enum: ['user', 'admin', 'moderator'] }).default('user').notNull(),
  minecraftUsername: text('minecraft_username').unique(),
  minecraftUuid: text('minecraft_uuid').unique(),
  avatar: text('avatar'),
  bio: text('bio'),
  // Per-user UI preferences
  preferredBackground: text('preferred_background'), // one of: 'space' | 'matrix' | 'data' | 'pixels' | 'neural' | 'none' (null = inherit site default)
  donationRankId: text('donation_rank_id').references(() => donationRanks.id, { onDelete: 'set null' }),
  rankExpiresAt: integer('rank_expires_at', { mode: 'timestamp' }),
  totalDonated: real('total_donated').default(0),
  // XP and Leveling System
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  title: text('title'), // Custom title/rank earned through leveling
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Settings table
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Registration codes table
export const registrationCodes = sqliteTable('registration_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  minecraftUsername: text('minecraft_username').notNull(),
  minecraftUuid: text('minecraft_uuid').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
});

// Servers table
export const servers = sqliteTable('servers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  ipAddress: text('ip_address').notNull(),
  port: integer('port').default(25565).notNull(),
  modpackName: text('modpack_name'),
  bluemapUrl: text('bluemap_url'),
  curseforgeUrl: text('curseforge_url'),
  status: text('status').default('offline').notNull(),
  playersOnline: integer('players_online').default(0).notNull(),
  playersMax: integer('players_max').default(0).notNull(),
  version: text('version'),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Blog posts table
export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  published: integer('published', { mode: 'boolean' }).default(false).notNull(),
  featuredImage: text('featured_image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Forum categories table
export const forumCategories = sqliteTable('forum_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  orderIndex: integer('order_index').default(0).notNull(),
  createPermission: text('create_permission', { enum: ['user', 'moderator', 'admin'] }).default('user').notNull(),
  replyPermission: text('reply_permission', { enum: ['user', 'moderator', 'admin'] }).default('user').notNull(),
  viewPermission: text('view_permission', { enum: ['user', 'moderator', 'admin'] }).default('user').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Forum posts table
export const forumPosts = sqliteTable('forum_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => forumCategories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pinned: integer('pinned', { mode: 'boolean' }).default(false).notNull(),
  locked: integer('locked', { mode: 'boolean' }).default(false).notNull(),
  views: integer('views').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Forum replies table
export const forumReplies = sqliteTable('forum_replies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Forum votes table (for upvotes/downvotes)
export const forumVotes = sqliteTable('forum_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }),
  replyId: integer('reply_id').references(() => forumReplies.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: text('vote_type', { enum: ['upvote', 'downvote'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// User engagement scores (for leaderboard)
export const userEngagement = sqliteTable('user_engagement', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  totalPoints: integer('total_points').default(0).notNull(),
  postsCreated: integer('posts_created').default(0).notNull(),
  commentsCreated: integer('comments_created').default(0).notNull(),
  forumPostsCreated: integer('forum_posts_created').default(0).notNull(),
  forumRepliesCreated: integer('forum_replies_created').default(0).notNull(),
  upvotesReceived: integer('upvotes_received').default(0).notNull(),
  downvotesReceived: integer('downvotes_received').default(0).notNull(),
  likesReceived: integer('likes_received').default(0).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Social posts table
export const socialPosts = sqliteTable('social_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Social comments table
export const socialComments = sqliteTable('social_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parentCommentId: integer('parent_comment_id'),
  likesCount: integer('likes_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Social comment likes table
export const socialCommentLikes = sqliteTable('social_comment_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  commentId: integer('comment_id').notNull().references(() => socialComments.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Social likes table
export const socialLikes = sqliteTable('social_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Friendships table
export const friendships = sqliteTable('friendships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: integer('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted', 'blocked'] }).default('pending').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Private messages table
export const privateMessages = sqliteTable('private_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  read: integer('read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Donations table
export const donations = sqliteTable('donations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  minecraftUsername: text('minecraft_username'),
  minecraftUuid: text('minecraft_uuid'),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  method: text('method'),
  message: text('message'),
  displayed: integer('displayed', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Donation ranks table
export const donationRanks = sqliteTable('donation_ranks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  minAmount: real('min_amount').notNull(),
  color: text('color').notNull(),
  textColor: text('text_color').notNull(),
  icon: text('icon'),
  badge: text('badge'),
  glow: integer('glow', { mode: 'boolean' }).default(false).notNull(),
  duration: integer('duration').default(30).notNull(), // days
  subtitle: text('subtitle'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Chat messages table (Discord integration)
export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordMessageId: text('discord_message_id').unique(), // Discord message ID for deduplication
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar'),
  content: text('content'),
  embeds: text('embeds'), // JSON string of Discord embeds
  attachments: text('attachments'), // JSON string of attachments
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Stories table
export const stories = sqliteTable('stories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  backgroundColor: text('background_color').default('#000000').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Story views table
export const storyViews = sqliteTable('story_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storyId: integer('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Groups table
export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  creatorId: integer('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  privacy: text('privacy', { enum: ['public', 'private'] }).default('public').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Group members table
export const groupMembers = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'moderator', 'member'] }).default('member').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Group posts table
export const groupPosts = sqliteTable('group_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  pinned: integer('pinned', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Group post comments table
export const groupPostComments = sqliteTable('group_post_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => groupPosts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Group post likes table
export const groupPostLikes = sqliteTable('group_post_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => groupPosts.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Reported content table (universal for all content types)
export const reportedContent = sqliteTable('reported_content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentType: text('content_type', { 
    enum: ['social_post', 'forum_post', 'forum_reply', 'group_post', 'group_comment', 'social_comment'] 
  }).notNull(),
  contentId: integer('content_id').notNull(),
  reporterId: integer('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status', { enum: ['pending', 'reviewed', 'dismissed', 'actioned'] }).default('pending').notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  creatorId: integer('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  coverImage: text('cover_image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Event attendees table
export const eventAttendees = sqliteTable('event_attendees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['going', 'interested', 'not_going'] }).default('going').notNull(),
  respondedAt: integer('responded_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'friend_request', 'message', 'comment', etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  read: integer('read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// API Keys table
export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // e.g., 'registration'
  key: text('key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Site Settings table (for configurable values)
export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'), // JSON string for complex values
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// XP Transactions table (tracks all XP gains/losses)
export const xpTransactions = sqliteTable('xp_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Can be positive or negative
  source: text('source').notNull(), // 'post_create', 'comment_create', 'forum_post', 'daily_login', etc.
  sourceId: integer('source_id'), // ID of the related entity (post ID, comment ID, etc.)
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Achievements table
export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(), // e.g., 'first_post', 'level_10', 'social_butterfly'
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // Emoji or icon name
  category: text('category', { enum: ['social', 'forum', 'leveling', 'special'] }).notNull(),
  xpReward: integer('xp_reward').default(0).notNull(),
  requirement: text('requirement').notNull(), // JSON string with requirement data
  hidden: integer('hidden', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// User Achievements table (tracks which users have which achievements)
export const userAchievements = sqliteTable('user_achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0).notNull(), // For progressive achievements
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Level Rewards table (defines rewards for reaching certain levels)
export const levelRewards = sqliteTable('level_rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: integer('level').notNull().unique(),
  title: text('title'), // Special title/rank awarded at this level
  badge: text('badge'), // Badge icon/emoji
  description: text('description'),
  rewardType: text('reward_type', { enum: ['title', 'badge', 'feature', 'currency'] }),
  rewardValue: text('reward_value'), // JSON string with reward details
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Daily Streaks table (tracks login streaks for bonus XP)
export const dailyStreaks = sqliteTable('daily_streaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastLoginDate: integer('last_login_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type RegistrationCode = typeof registrationCodes.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type ForumReply = typeof forumReplies.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialComment = typeof socialComments.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type DonationRank = typeof donationRanks.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ForumVote = typeof forumVotes.$inferSelect;
export type UserEngagement = typeof userEngagement.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type LevelReward = typeof levelRewards.$inferSelect;
export type DailyStreak = typeof dailyStreaks.$inferSelect;
export type GroupPost = typeof groupPosts.$inferSelect;
export type GroupPostComment = typeof groupPostComments.$inferSelect;
export type ReportedContent = typeof reportedContent.$inferSelect;
