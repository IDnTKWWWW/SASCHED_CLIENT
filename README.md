# SASCHED - Student Appointment System

![SASCHED Banner](<img width="500" height="500" alt="logo" src="https://github.com/user-attachments/assets/89d80e4c-ff55-4876-a1a5-dc5c66d77503" />
)

A modern, real-time student queueing and appointment portal built to streamline student services for Cashier and Registrar transactions.

## 🚀 Features

- **Real-Time Queue Monitoring:** Built with Supabase Realtime to instantly broadcast queue updates, "Now Serving" tickets, and waitlist counts without refreshing.
- **Smart Booking System:** Allows students to book time slots for different departments.
- **One-Ticket Policy:** Enforces a strict one-active-ticket-per-student rule to prevent spam and ensure fair queueing.
- **Dynamic Window Statuses:** Administrators can toggle window statuses (Open, Cut-off, Closed) which instantly reflect on the student portal.
- **Secure Authentication:** Powered by Supabase Auth for seamless student login.
- **Responsive Design:** A beautifully crafted, mobile-friendly interface.

## 🛠️ Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Vanilla CSS (for glassmorphism & custom animations)
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Supabase Project (with the required database schema)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/sas-user-space.git
   cd sas-user-space
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🗄️ Database Schema

This project relies on a specific Supabase PostgreSQL schema to function. The primary tables include:

- `queue_tickets`: Manages the queue state, ticket numbers, user mapping, and appointment times.
- `window_status`: A single-row configuration table to manage the live open/cutoff/closed states of the Cashier and Registrar windows.

*(Note: The admin portal for managing these queues is maintained in a separate repository).*

## 🔒 Security

- Environment variables (`.env`) are strictly ignored via `.gitignore` to prevent secret leakage.
- Uses Supabase Publishable Keys for safe client-side database interactions alongside Row Level Security (RLS) policies.

## 📄 License

This project is licensed under the MIT License.
