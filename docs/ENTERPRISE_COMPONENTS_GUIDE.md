# 🎨 Enterprise Components Guide

Complete reference for the new enterprise-grade component library.

---

## 📦 Component Library

### Core Components

#### 1. Card (`enterprise-card.tsx`)

Professional glass morphism cards with multiple variants.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/enterprise-card';

// Basic Usage
<Card variant="glass" hover glow>
  <CardHeader icon={Users}>
    <CardTitle gradient>User Statistics</CardTitle>
    <CardDescription>Overview of user activity</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

**Props**:
- `variant`: `'glass'` | `'solid'` | `'bordered'` | `'gradient'`
- `hover`: Enable hover effects (default: true)
- `glow`: Add glow shadow
- `icon`: Lucide icon for header

---

#### 2. Button (`enterprise-button.tsx`)

Premium buttons with gradients and animations.

```tsx
import { Button } from '@/components/ui/enterprise-button';

// Primary Gradient (Default)
<Button variant="primary" size="lg">
  Get Started
</Button>

// Animated Gradient
<Button variant="gradient">
  Special Offer
</Button>

// Glass Effect
<Button variant="glass">
  Transparent
</Button>

// Loading State
<Button loading loadingText="Saving...">
  Save Changes
</Button>
```

**Variants**:
- `primary`: Gradient cyan → teal with glow
- `gradient`: Full spectrum animated gradient
- `glass`: Transparent with backdrop blur
- `outline`: Border only
- `ghost`: Transparent, bg on hover
- `danger`: Red for destructive actions
- `success`: Green for positive actions
- `secondary`: Muted background

**Sizes**: `sm` | `md` | `lg` | `xl` | `icon`

---

#### 3. StatCard (`stat-card.tsx`)

Metrics display with trends.

```tsx
import { StatCard } from '@/components/ui/stat-card';
import { Users } from 'lucide-react';

<StatCard
  title="Total Users"
  value="10,234"
  icon={Users}
  trend={{ value: 12, isPositive: true }}
  description="+145 today"
  variant="info"
  onClick={() => router.push('/admin/users')}
/>
```

**Props**:
- `title`: Metric label
- `value`: Main value (string | number)
- `icon`: Lucide icon
- `trend`: `{ value: number, isPositive: boolean }`
- `description`: Helper text
- `variant`: `'default'` | `'success'` | `'warning'` | `'error'` | `'info'`
- `loading`: Show skeleton
- `onClick`: Click handler

---

#### 4. Input (`enterprise-input.tsx`)

Form inputs with glass effects.

```tsx
import { Input, Textarea, FormField, Label, FormDescription, FormError } from '@/components/ui/enterprise-input';
import { Mail } from 'lucide-react';

<FormField>
  <Label required>Email</Label>
  <Input 
    type="email"
    placeholder="Enter your email"
    icon={Mail}
    iconPosition="left"
    error={errors.email}
  />
  <FormDescription>We'll never share your email</FormDescription>
  <FormError message={errors.email} />
</FormField>
```

**Components**:
- `Input`: Single line text
- `Textarea`: Multi-line text
- `FormField`: Container wrapper
- `Label`: Form label with required indicator
- `FormDescription`: Helper text
- `FormError`: Error message with animation

---

#### 5. Modal (`enterprise-modal.tsx`)

Professional dialogs with animations.

```tsx
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter, ConfirmModal } from '@/components/ui/enterprise-modal';

// Custom Modal
<Modal open={isOpen} onClose={handleClose} size="lg">
  <ModalHeader>
    <ModalTitle>Edit User</ModalTitle>
  </ModalHeader>
  <ModalContent>
    <form>...</form>
  </ModalContent>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </ModalFooter>
</Modal>

// Confirmation Dialog
<ConfirmModal
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete User?"
  description="This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  loading={isDeleting}
/>
```

**Props**:
- `size`: `'sm'` | `'md'` | `'lg'` | `'xl'` | `'full'`
- `closeOnBackdrop`: Click outside to close (default: true)
- `showCloseButton`: Show X button (default: true)

---

#### 6. DataTable (`data-table.tsx`)

Professional data tables with sorting.

```tsx
import { DataTable, type Column } from '@/components/ui/data-table';

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: Date;
}

const columns: Column<User>[] = [
  { key: 'username', label: 'Username', sortable: true },
  { 
    key: 'role', 
    label: 'Role', 
    sortable: true,
    render: (user) => (
      <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
        {user.role}
      </Badge>
    ),
  },
  { key: 'createdAt', label: 'Joined', sortable: true },
];

<DataTable
  columns={columns}
  data={users}
  keyExtractor={(user) => user.id.toString()}
  onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
  loading={isLoading}
  emptyMessage="No users found"
/>
```

**Features**:
- Column sorting (click headers)
- Custom cell rendering
- Row click handlers
- Loading state
- Empty state
- Generic TypeScript support

---

#### 7. Skeleton (`skeleton.tsx`)

Loading placeholders.

```tsx
import { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText } from '@/components/ui/skeleton';

// Basic Skeleton
<Skeleton className="h-10 w-full" />

// Pre-built Components
<SkeletonCard />
<SkeletonAvatar size="lg" />
<SkeletonText lines={5} />
```

**Variants**:
- `default`: Rounded rectangle
- `text`: Text line
- `circular`: Circle (avatar)
- `rectangular`: Sharp corners

---

#### 8. Toast (`toast.tsx`)

Toast notification system.

```tsx
'use client';

import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const { toast, success, error, info, warning } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      success('Saved!', 'Your changes have been saved');
    } catch (err) {
      error('Error', 'Failed to save changes');
    }
  };
  
  // Custom toast
  toast({
    type: 'info',
    title: 'Processing',
    description: 'This may take a moment...',
    duration: 3000,
  });
}
```

**Setup** (Add to root layout):
```tsx
import { ToastProvider } from '@/components/ui/toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

**Methods**:
- `success(title, description?)`
- `error(title, description?)`
- `info(title, description?)`
- `warning(title, description?)`
- `toast({ type, title, description, duration })`

---

## 🎨 Design Tokens

### Colors

```tsx
// Brand Colors
bg-brand-cyan       // #00D9FF
bg-brand-teal       // #06FFA5
bg-brand-purple     // #8B5CF6

// Status Colors
bg-success          // #10b981
bg-warning          // #f59e0b
bg-error            // #ef4444
bg-info             // #3b82f6

// Glass Colors
bg-glass-light      // rgba(255,255,255,0.05)
bg-glass            // rgba(255,255,255,0.1)
bg-glass-dark       // rgba(0,0,0,0.3)

// Gradients
bg-gradient-brand        // cyan → teal
bg-gradient-brand-reverse
bg-gradient-full         // full spectrum
bg-gradient-purple
bg-gradient-gold
```

### Shadows

```tsx
shadow-glass        // Subtle glass effect
shadow-glass-lg     // Stronger glass effect
shadow-glow-sm      // Small glow
shadow-glow         // Medium glow
shadow-glow-lg      // Large glow
shadow-glow-cyan    // Cyan glow
shadow-glow-purple  // Purple glow
```

### Animations

```tsx
animate-fade-in
animate-fade-out
animate-slide-in-up
animate-slide-in-down
animate-slide-in-left
animate-slide-in-right
animate-scale-in
animate-scale-out
animate-shimmer
animate-pulse
animate-pulse-glow
animate-float
animate-gradient-x
animate-gradient-y
animate-gradient-xy
```

---

## 📐 Layout Components

### AdminSidebar

```tsx
import { AdminSidebar } from '@/components/layout/admin-sidebar';

// In admin layout
<div className="flex min-h-screen">
  <AdminSidebar />
  <main className="flex-1 lg:ml-64">
    {children}
  </main>
</div>
```

**Features**:
- 14 navigation items
- Active route highlighting
- Collapsible on desktop
- Mobile drawer
- Smooth transitions

### AdminHeader

```tsx
import { AdminHeader } from '@/components/layout/admin-header';

// In admin layout
<div className="flex-1 lg:ml-64">
  <AdminHeader />
  <main>{children}</main>
</div>
```

**Features**:
- Search bar
- Notifications
- User menu with avatar
- Sticky positioning

---

## 🚀 Usage Patterns

### Page Structure

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/enterprise-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/enterprise-button';

export default function AdminPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Page Title</h1>
        <p className="text-muted-foreground">Description text</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard {...} />
        <StatCard {...} />
        <StatCard {...} />
        <StatCard {...} />
      </div>

      {/* Content Cards */}
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
        </CardHeader>
        <CardContent>
          Content here
        </CardContent>
      </Card>
    </div>
  );
}
```

### Form Pattern

```tsx
import { FormField, Label, Input, FormError } from '@/components/ui/enterprise-input';
import { Button } from '@/components/ui/enterprise-button';

function MyForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  return (
    <form className="space-y-6">
      <FormField>
        <Label required>Username</Label>
        <Input 
          placeholder="Enter username"
          error={errors.username}
        />
        <FormError message={errors.username} />
      </FormField>

      <div className="flex gap-3">
        <Button variant="ghost" type="button">
          Cancel
        </Button>
        <Button variant="primary" loading={loading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
```

### Table Pattern

```tsx
import { DataTable, type Column } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/enterprise-card';

const columns: Column<Item>[] = [...];

<Card variant="glass">
  <CardHeader>
    <CardTitle>Items</CardTitle>
  </CardHeader>
  <CardContent>
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      loading={isLoading}
    />
  </CardContent>
</Card>
```

---

## ✨ Best Practices

1. **Consistent Spacing**: Use `space-y-6` or `space-y-8` for vertical spacing
2. **Responsive Grids**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
3. **Animations**: Add `animate-fade-in` to page roots
4. **Glass Effect**: Use `variant="glass"` for cards
5. **Gradients**: Use for CTAs and special elements
6. **Loading States**: Always show skeletons or spinners
7. **Error Handling**: Use toast notifications
8. **Accessibility**: Add proper labels and ARIA attributes
9. **Mobile First**: Design for mobile, enhance for desktop
10. **Type Safety**: Use TypeScript interfaces for all props

---

**Ready to build amazing enterprise UIs!** 🚀
