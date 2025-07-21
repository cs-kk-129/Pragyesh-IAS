# Pragyesh IAS - AI-Powered UPSC Preparation Platform

## Overview

This is a comprehensive UPSC (Union Public Service Commission) examination preparation platform built with modern web technologies. The application provides AI-powered learning features including personalized study plans, mock tests, doubt-solving, and progress tracking to help students prepare for India's most prestigious civil service examination.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session management
- **API Design**: RESTful APIs with consistent error handling

### Hybrid Python Integration
- **AI Services**: FastAPI backend for OpenAI integration and advanced evaluation
- **Document Processing**: Python services for PDF processing and content analysis
- **Startup Script**: Integrated system launcher for both Node.js and Python services

## Key Components

### Authentication System
- **Strategy**: Session-based authentication with Passport.js
- **Security**: Password hashing using Node.js crypto module with scrypt
- **Session Storage**: PostgreSQL-backed session store for persistence
- **Admin Access**: Dedicated admin user (csadmin) with enhanced privileges

### Database Schema
- **Users**: Student registration and profile management
- **Content Structure**: Hierarchical organization (Subjects → Topics → Subtopics)
- **Assessment System**: Quizzes, questions, and attempt tracking
- **Progress Tracking**: User progress, bookmarks, and study streaks
- **Study Planning**: AI-generated personalized study plans
- **Communication**: Chat messages for AI doubt-solving

### AI Integration
- **OpenAI Integration**: GPT-4 for quiz generation and doubt-solving
- **Bilingual Support**: Content generation in both English and Hindi
- **Mock Test Generation**: Automated creation of UPSC-style practice tests
- **Personalized Learning**: AI-driven study plan recommendations

### Content Management
- **Subject Coverage**: Complete UPSC syllabus including History, Geography, Polity, Economics, etc.
- **Question Bank**: Comprehensive question database with proper categorization
- **Mock Tests**: Realistic practice examinations with detailed analytics
- **Progress Analytics**: Detailed performance tracking and improvement suggestions

## Data Flow

1. **User Registration/Login**: Authentication flow with session establishment
2. **Content Access**: Hierarchical browsing of subjects, topics, and subtopics
3. **Study Planning**: AI-generated personalized schedules based on user preferences
4. **Assessment Flow**: Quiz attempts with real-time scoring and analytics
5. **Progress Tracking**: Continuous monitoring of learning metrics and streaks
6. **AI Assistance**: Doubt-solving through chat interface with OpenAI integration

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless integration
- **AI Services**: OpenAI API for content generation and assistance
- **Authentication**: Passport.js ecosystem for security
- **UI Framework**: Radix UI primitives with Shadcn/ui components

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Modern build tooling with hot module replacement
- **ESBuild**: Fast production builds for server-side code

### Python Integration
- **FastAPI**: High-performance API framework for AI services
- **OpenAI Python**: Official client for AI model interactions
- **ReportLab**: PDF generation for study materials and reports

## Deployment Strategy

### Development Environment
- **Platform**: Replit with multi-language support (Node.js + Python + PostgreSQL)
- **Hot Reload**: Vite development server with instant updates
- **Database**: Neon PostgreSQL with automatic provisioning
- **Environment**: Development mode with debug logging

### Production Configuration
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Server**: Node.js production server with optimized assets
- **Database**: PostgreSQL with connection pooling and error handling
- **Deployment**: Autoscale deployment target with proper port configuration

### Database Management
- **Migrations**: Drizzle Kit for schema evolution
- **Seeding**: Comprehensive UPSC curriculum data import
- **Backup Strategy**: Session-based storage with PostgreSQL persistence

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 17, 2025. Initial setup
- July 21, 2025. Enhanced file upload processing with comprehensive bilingual support:
  * Fixed question extraction to capture ALL questions from uploaded files (not just subset)
  * Added automatic translation capability for monolingual content to bilingual format
  * Implemented proper null handling for unspecified subjects/topics instead of default assignment
  * Enhanced pagination display with 15 questions per page and improved UI for bilingual content
  * Updated OpenAI prompts to extract complete question sets with proper translation
  * Fixed AI chat responses to be conversational and natural instead of structured format