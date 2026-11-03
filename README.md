cd ~/Desktop/ServiceFinder
cat > README.md << 'EOF'
# ServiceFinder 🔧

A full-stack service booking platform connecting customers with service providers.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS (served via Nginx)
- **Backend:** Spring Boot 3.4.1 + Spring Security + JWT
- **Database:** MySQL 8 (Indexed Schema)
- **Cache:** Redis (TTL: 10 minutes)
- **Container:** Docker + Docker Compose

## Features

### Authentication
- **Multi-method Signup/Login:**
  - Phone OTP (demo OTP printed on console for development)
  - Email OTP (real email via Gmail SMTP)
  - Google Sign-In (OAuth2)
- **Forgot Password:** Reset via Email OTP
- **Role-based access:** Customer, Provider, Admin

### Customer Features
- Browse and search providers by service and location
- Send service requests with location, date, and time
- Track request status (Pending, Accepted, Rejected)
- Profile management (picture upload, edit name/phone, change password)

### Provider Features
- Dashboard with all incoming requests
- Accept/Reject/Delete requests
- Multi-provider support (multiple services per user)
- Real-time notification badges for pending requests

### Admin Features
- Manage customers, providers, and services
- View all requests and platform statistics

### Technical Features
- **Indexed Database Schema** for fast queries
- **Redis Caching** for provider listings
- **Docker Compose** for one-command full-stack deployment
- **Backup & Restore** procedures documented

## Quick Start (Docker Compose) 🚀

**Ek command mein poora stack chalayein:**

```bash
git clone git@github.com:Junaid-badshah/ServiceFinder-Web-App.git
cd ServiceFinder-Web-App
sudo docker compose up -d
