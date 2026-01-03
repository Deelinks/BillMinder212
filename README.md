
# 💳 BillMinder - Professional Bill Tracking MVP

**BillMinder** is a stable, high-performance mobile-first web application designed to help users manage recurring financial obligations without the clutter of traditional banking apps.

## 🚀 Core Features

- **Offline-First Management**: Manage your bills anywhere, anytime. Data is stored locally and syncs automatically when a connection is restored.
- **Intelligent Recurring Logic**: Mark a bill as "Paid" and BillMinder automatically calculates and schedules the next due date based on your selected frequency (Monthly, Yearly, Custom).
- **Professional PDF Reports**: Export your active bills or payment history into a clean, formatted PDF for personal record-keeping or financial planning.
- **Multi-Channel Reminders**:
    - Native Browser Notifications (3 days before, 1 day before, and on the due date).
    - One-tap WhatsApp sharing for sending formatted reminders to family or yourself.
- **Secure Cloud Sync**: Optional upgrade to Supabase-backed authentication to sync data across all your devices.
- **Onboarding & Help Center**: Integrated walkthrough for new users and a detailed FAQ section.

## 🛠 Tech Stack

- **Frontend**: React 19 (ESM based), Tailwind CSS
- **Icons**: FontAwesome 6
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **PDF Engine**: jsPDF + AutoTable
- **Deployment**: PWA Ready (Service Worker support recommended)

## 📦 How to host on GitHub

1. **Create a new repository** on GitHub.
2. **Download these files** into a local directory.
3. **Initialize Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial MVP release of BillMinder"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/billminder.git
   git push -u origin main
   ```

## 🔑 Project Credentials (Supabase)
This project is configured to use a pre-provisioned Supabase instance.
- **Project ID**: `wpxquyedyjpfnsbfddcy`
- **Region**: US East (N. Virginia)

## 📄 License
This project is released as a professional MVP.
