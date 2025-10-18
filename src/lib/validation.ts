import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const minecraftRegisterSchema = z.object({
  code: z.string().length(6, 'Code must be 6 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, 'Password must contain both letters and numbers'),
});

// Minecraft integration schemas
export const generateCodeSchema = z.object({
  minecraft_username: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/, 'Invalid Minecraft username'),
  minecraft_uuid: z.string().uuid('Invalid Minecraft UUID'),
});

export const minecraftLoginSchema = z.object({
  minecraft_username: z.string().min(3).max(16),
  minecraft_uuid: z.string().uuid('Invalid Minecraft UUID'),
  password: z.string().min(1, 'Password is required'),
});

export const checkRegistrationSchema = z.object({
  minecraft_uuid: z.string().uuid('Invalid Minecraft UUID'),
});

// Forum schemas
export const createForumPostSchema = z.object({
  categoryId: z.number().int().positive(),
  title: z.string().min(1, 'Title cannot be empty').max(200),
  content: z.string().min(1, 'Content cannot be empty').max(10000),
});

export const createForumReplySchema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1, 'Reply cannot be empty').max(5000),
});

// Social schemas
export const createSocialPostSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty').max(2000),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
});

// Message schemas
export const sendMessageSchema = z.object({
  recipientId: z.number().int().positive(),
  content: z.string().min(1, 'Message cannot be empty').max(5000),
});

// Blog schemas
export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200),
  content: z.string().min(1, 'Content cannot be empty'),
  excerpt: z.string().max(500).optional(),
  published: z.boolean().default(false),
  featuredImage: z.string().url().optional().or(z.literal('')),
});

// Server schemas
export const createServerSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  ipAddress: z.string().min(3),
  port: z.number().int().min(1).max(65535).default(25565),
  version: z.string().optional(),
  modpackName: z.string().optional(),
  bluemapUrl: z.string().url().optional().or(z.literal('')),
  curseforgeUrl: z.string().url().optional().or(z.literal('')),
});

// Donation schemas
export const createDonationSchema = z.object({
  userId: z.number().int().positive().optional(),
  minecraftUsername: z.string().optional(),
  minecraftUuid: z.string().uuid().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  method: z.string().optional(),
  message: z.string().max(500).optional(),
  displayed: z.boolean().default(true),
});

// Profile update schema
export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

// Settings schema
export const updateSettingsSchema = z.object({
  siteName: z.string().min(3).max(100).optional(),
  siteDescription: z.string().max(500).optional(),
  discordEnabled: z.boolean().optional(),
  forumEnabled: z.boolean().optional(),
  socialEnabled: z.boolean().optional(),
  donationsEnabled: z.boolean().optional(),
});
