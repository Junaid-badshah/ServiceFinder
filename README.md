cat > README.md << 'EOF'
# ServiceFinder 🔧

A comprehensive full-stack service booking platform connecting customers with local service providers (Plumbers, Electricians, Technicians, etc.). Built with a focus on scalable architecture, secure role-based access, and a seamless user experience.

## 🚀 Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Recharts (Analytics), Leaflet.js (Maps)
- **Backend:** Java, Spring Boot 3.4.1, Spring Security, JWT, Spring Data JPA
- **Database:** MySQL 8
- **Cache:** Redis (TTL: 10 minutes for optimized API responses)
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions (Auto build & deploy)

## ✨ Key Features

### 🔐 Authentication & Security
- **Multi-method Signup/Login:**
  - Phone OTP (Dev Mode: OTP printed on console)
  - Email OTP (Real email via Gmail SMTP)
  - Google Sign-In (OAuth2)
- **Forgot Password:** Secure reset via Email OTP.
- **Role-based Access Control:** Distinct dashboards for Customer, Provider, and Admin.
- **Privacy First:** Customer phone numbers are hidden from providers until a request is accepted.

### 👤 Customer Features
- Browse and search providers by service and location.
- Send service requests with location, date, time, and images.
- Live tracking of the provider's location using interactive maps (Leaflet).
- Real-time chat with the provider after request acceptance.
- Profile management and request history.

### 🔧 Provider Features
- **Strict Onboarding:** New providers are forced to add their service profile before accessing the dashboard.
- **Dashboard & Notifications:** Real-time notification badges for new requests.
- **Bidding & Acceptance:** Accept/Reject requests and track active jobs.
- **Wallet System:** Dedicated provider wallet for managing earnings.
- **Multi-Service Support:** Providers can offer multiple services under one account.
- **My Services Page:** View and manage only their own services.

### 👑 Admin Features (Command Center)
- **Analytics Dashboard:** Interactive line charts (Recharts) displaying platform revenue with **Custom Date Filters** (Daily, Monthly, Yearly, Custom Range).
- **User Management:** Complete control over Customers, Providers, and Admins.
- **Commission Control:** Dynamic settings for Global and Service-wise commission percentages.
- **Wallet Management:** Monitor all provider wallets and transactions.
- **Cancellation & Refund:** Review and process cancellation requests with refund amount options.
- **Privacy Settings:** Global toggles to hide/show customer or provider information.

## 🏗️ Architecture & Technical Highlights
- **Redis Caching:** Provider listings and frequent queries are cached to reduce database load.
- **Database Indexing:** Optimized MySQL queries for high performance.
- **Dockerized:** One-command deployment for the entire stack (Frontend, Backend, MySQL, Redis).
- **Responsive UI:** Mobile-first design using Tailwind CSS with Dark Mode support.

## 🛠️ Quick Start (Docker Compose)

**Ek command mein poora stack chalayein:**

### 1. Repository Clone Karein
```bash
git clone git@github.com:Junaid-badshah/ServiceFinder.git
cd ServiceFinder
