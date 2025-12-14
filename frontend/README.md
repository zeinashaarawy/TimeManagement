# HR System — Frontend Setup (Milestone 3)

This document describes the setup and folder structure for the **frontend** of the HR System.  
The frontend uses **Next.js, React, TailwindCSS, and TypeScript**, with a modular structure matching the backend subsystems.

---

# 🛠 Required Installs

Run inside the `frontend` directory:

```bash
npm install next react react-dom
npm install -D tailwindcss@3 postcss autoprefixer
npm install lucide-react
npx tailwindcss init -p
```

These libraries provide:

- **Next.js** — routing and React app framework  
- **TailwindCSS v3** — styling (v3 is required since v4 causes compatibility issues)  
- **PostCSS & Autoprefixer** — CSS transformation  
- **Lucide-react** — icon library for UI components  

---

# 📁 Project Folder Structure (Frontend)

This is the final agreed-upon structure, using ONLY one subsystems folder under `pages/` (Next.js routing).  
Each subsystem will place its UI logic **inside its own folder** here.

```
frontend/
│
├── pages/
│   ├── index.tsx                # Homepage (modules, hero section, navigation)
│   ├── _app.tsx                 # Imports global styles
│   │
│   ├── subsystems/              # Official subsystem pages (Next.js routing)
│   │   ├── employee-profile/
│   │   │   └── index.tsx
│   │   ├── leaves/
│   │   │   └── index.tsx
│   │   ├── payroll-configuration/
│   │   │   └── index.tsx
│   │   ├── payroll-execution/
│   │   │   └── index.tsx
│   │   ├── payroll-tracking/
│   │   │   └── index.tsx
│   │   ├── recruitment/
│   │   │   └── index.tsx
│   │   └── time-management/
│   │       └── index.tsx
│   │
│
├── components/                  # Future shared UI components
│
├── styles/
│   └── globals.css              # Tailwind base/components/utilities
│
├── public/                      # Images + assets
│
├── tailwind.config.js           # Tailwind v3 config
├── postcss.config.js            # Tailwind + autoprefixer
├── package.json
└── tsconfig.json
```

---

# 🧩 Subsystem Pages (Placeholders)

Each subsystem has a placeholder page:

```
<Subsystem Name> Coming Soon...
```

These pages match the homepage theme and are ready for feature development.

Example (employees-profile/index.tsx):

```tsx
export default function EmployeeProfile() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <h1 className="text-4xl lg:text-6xl font-light text-center">
        Employee Profile Coming Soon...
      </h1>
    </div>
  );
}
```

All subsystem pages follow this same pattern.

---

# 🔗 Module Cards → Subsystem Pages

The homepage modules are now linked to these routes:

```
/subsystems/employee-profile
/subsystems/leaves
/subsystems/payroll-configuration
/subsystems/payroll-execution
/subsystems/payroll-tracking
/subsystems/recruitment
/subsystems/time-management
```

---

# ▶️ Run the Frontend

```bash
npm run dev
```

Your app will run at:

```
http://localhost:3000
```

---


