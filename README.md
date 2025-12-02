# Task Management System

A comprehensive task management system built with Next.js, Supabase, and modern web technologies.

## Features

- **User Authentication**: Secure login and signup with Supabase Auth
- **Role-based Access Control**: Admin and Employee roles with different permissions
- **Task Management**: Create, assign, track, and manage tasks with deadlines and priorities
- **Dashboard Analytics**: Overview of tasks, statistics, and completion trends
- **User Profiles**: Upload and manage profile avatars with Supabase Storage
- **Dark Mode**: Full support for dark/light themes across all pages
- **Email Notifications**: Automated email notifications using Brevo API
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Real-time Updates**: Live data synchronization with Supabase

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for avatar uploads)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Email Service**: Brevo (formerly Sendinblue)
- **TypeScript**: Full type safety

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Email Configuration (Brevo)
```env
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations from the `supabase/` directory
3. Set up the database schema using `supabase/master_schema.sql`
4. Configure Storage for avatar uploads (see `SUPABASE_STORAGE_SETUP.md`)

### 3. Configure Email Service

1. Sign up for Brevo at [brevo.com](https://brevo.com)
2. Get your API key from the Brevo dashboard
3. Add the API key and sender email to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Avatar Upload Setup

The application includes a comprehensive avatar upload system. To enable this feature:

1. Create a storage bucket named `avatars` in your Supabase project
2. Configure storage policies for secure file access
3. See `SUPABASE_STORAGE_SETUP.md` for detailed setup instructions

**Features:**
- Drag-and-drop image upload
- Image preview before upload
- Automatic file validation (type and size)
- Automatic deletion of old avatars
- Support for JPEG, PNG, and WebP formats
- Maximum file size: 5MB

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (employee)/        # Employee pages
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── components/        # React components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase helpers
│   └── brevo/             # Email service
├── supabase/              # Database migrations
└── types/                 # TypeScript type definitions
```

## User Roles

### Admin
- Full access to all features
- User management (invite, delete users)
- Task management (create, assign, edit, delete)
- View all tasks and user analytics
- System settings and configuration

### Employee
- View assigned tasks
- Update task status and progress
- Add task comments and notes
- Manage personal profile
- View personal dashboard

## Dark Mode

The application fully supports dark mode with:
- System preference detection
- Manual toggle in sidebar
- Persistent theme selection
- Optimized color schemes for readability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the documentation files in the repository
- Review Supabase logs in your dashboard
- Check browser console for client-side errors
- Refer to `SUPABASE_STORAGE_SETUP.md` for storage-related issues
