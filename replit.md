# AgroQA - Agricultural AI Assistant

## Overview

AgroQA is a full-stack agricultural AI assistant application that combines Retrieval-Augmented Generation (RAG) technology with the Gemma 2B-IT language model to provide intelligent responses to agricultural queries. The system allows users to upload various types of agricultural data (CSV, PDF, TXT, images) and query this data using natural language. It supports both conversational interactions and computational analysis of agricultural datasets, with multi-language support for farmers worldwide.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses a modern React-based stack with TypeScript:
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite with ESM modules and hot module replacement

The frontend follows a component-based architecture with clear separation between chat interface, sidebar controls, and message display components.

### Backend Architecture
The server implements a REST API using Express.js with TypeScript:
- **Framework**: Express.js with TypeScript for type safety
- **File Upload**: Multer middleware for handling multipart file uploads
- **Services Pattern**: Modular service layer for RAG pipeline, data processing, embeddings, and vector search
- **Memory Storage**: In-memory storage implementation with interface abstraction for future database integration
- **Vector Search**: Custom vector similarity search implementation for chunk retrieval

### Data Processing Pipeline
The system implements a comprehensive RAG pipeline:
- **Text Extraction**: Supports CSV parsing, PDF text extraction, and plain text processing
- **Chunking Strategy**: Recursive character text splitting with configurable chunk sizes and overlap
- **Embedding Generation**: Hugging Face API integration using sentence-transformers models
- **Vector Storage**: In-memory vector storage with cosine similarity search
- **Query Processing**: Distinction between conversational queries and computational analysis

### Database Schema Design
Uses Drizzle ORM with PostgreSQL schema definition:
- **Users**: Authentication and user management
- **Datasets**: File metadata and processing status tracking
- **Chunks**: Text chunks with embeddings and metadata for vector search
- **Conversations**: Chat session management
- **Messages**: Message history with role-based content and metadata

The schema supports UUID primary keys, JSON metadata fields, and array types for embeddings.

### AI Integration Architecture
- **Language Model**: Hugging Face API integration with Gemma 2B-IT model
- **Embedding Model**: Sentence Transformers all-MiniLM-L6-v2 for text embeddings
- **RAG Implementation**: Context retrieval from vector database combined with prompt engineering
- **Computational Queries**: Special handling for data analysis and calculation requests

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **express**: Web framework for REST API
- **multer**: File upload middleware
- **csv-parser**: CSV file processing

### AI and ML Services
- **Hugging Face Inference API**: For language model inference and text embeddings
- **sentence-transformers**: Text embedding models via API
- **Gemma 2B-IT**: Instruction-tuned language model for response generation

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **axios**: HTTP client for API requests

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration and schema management
- **@replit/vite-plugin-***: Replit-specific development plugins

### File Processing
- **pdf-parse**: PDF text extraction (optional dependency)
- **csv-parser**: CSV file parsing and processing
- **multer**: File upload handling with type validation

The application is designed to be deployed on Replit with easy environment setup and automatic database provisioning through environment variables.