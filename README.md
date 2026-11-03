# ServiceFinder 🔧

A full-stack service booking platform connecting customers with local service providers.

## 🚀 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Nginx, Leaflet, Recharts
- **Backend:** Java, Spring Boot 3.4.1, Spring Security, JWT
- **Database:** MySQL 8
- **Cache:** Redis (10-minute TTL)
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions

## ✨ Key Features

### Authentication
- Phone OTP, Email OTP and Google Sign-In.
- Forgot Password via Email OTP.
- Role-based authentication (Admin, Provider, Customer).
- Customer privacy protection.

### Customer Features
- Search providers by service and location.
- Send service requests with date, time, location and images.
- Track request status.
- Live provider location tracking.
- Real-time chat after request acceptance.
- Manage profile and request history.

### Provider Features
- Mandatory service profile completion.
- Manage incoming service requests.
- Accept, Reject and Delete requests.
- Multiple services under one account.
- Real-time notifications.
- Provider wallet and balance management.

### Admin Features
- Analytics dashboard with interactive revenue charts.
- Daily, Monthly, Yearly and Custom Date Filters.
- Manage customers, providers and services.
- Manage provider wallets and commissions.
- Review cancellation and refund requests.
- View platform statistics and transactions.

## 🛠️ Installation & Run Project

### 1. Clone Repository

```bash
git clone git@github.com:Junaid-badshah/ServiceFinder.git
cd ServiceFinder
```

### 2. Start Application

Make sure Docker and Docker Compose are installed.

```bash
sudo docker compose up -d --build
```

Wait for the containers and database to initialize.

### 3. Open Website

Open your browser and visit:

**http://localhost:5174**

The ServiceFinder website will open. You can now log in using any of the three demo accounts below.

## 🔐 Demo Login Accounts

Use these accounts to explore the complete application and experience the different dashboards and interfaces.

| Account Type | Email / Phone | Password |
|---|---|---|
| 👑 Admin | admin@test.com | admin123 |
| 🔧 Provider | test.provider@test.com | test123 |
| 👤 Customer | 03125756192 | raza123 |

### What Can You Explore?

- **Admin:** Dashboard, analytics, users, commissions, wallets and cancellations.
- **Provider:** Dashboard, incoming requests, services, wallet and job management.
- **Customer:** Find Services, create requests, track providers and chat.

## ⏹️ Stop & Restart Application

**Stop the application:**

```bash
sudo docker compose stop
```

**Start it again:**

```bash
sudo docker compose start
```

**Stop and remove containers (database data remains safe in persistent volumes):**

```bash
sudo docker compose down
```

**Rebuild and start after code changes:**

```bash
sudo docker compose up -d --build
```

**Remove containers and database volumes (WARNING: deletes persistent database data):**

```bash
sudo docker compose down -v
```

## 🏗️ Technical Highlights

- Optimized MySQL database with indexing.
- Redis caching for provider listings.
- Docker-based full-stack deployment.
- Backup and restore procedures.
- Responsive user interface.

## 📌 Important Note

The demo accounts are intended for testing the Admin, Provider and Customer interfaces. According to the project configuration, these accounts are seeded through `init-db.sql`.

Make sure the database initialization file contains the demo accounts and their corresponding passwords before running the application.

---

**Developed by Junaid Badshah**

**GitHub:** [Junaid-badshah/ServiceFinder](https://github.com/Junaid-badshah/ServiceFinder)
