# API Documentation

This directory contains detailed documentation for all available API routes in the Nuxt SaaS Starter.

## Table of Contents

- [**Authentication**](./auth.md): Login, Signup, Magic Links, Session management.
- [**User Management**](./user.md): Profile updates, Sessions, Consent, Activity logs, Data export, Account deletion.
- [**Chat & Messaging**](./chat.md): Real-time messaging, E2E encryption, WebSocket API.
- [**Business Logic**](./business.md): Multi-tenant business operations and member management.
- [**Admin Controls**](./admin.md): System-wide audit logs and administrative tools.
- [**Utilities**](./utilities.md): File uploads, KV storage, Email services.

## General Information

- **Base URL**: `/api`
- **WebSocket**: `/_ws`
- **Response Format**: All endpoints return JSON.
- **Errors**: Standard HTTP status codes (200, 400, 401, 403, 404, 500).
