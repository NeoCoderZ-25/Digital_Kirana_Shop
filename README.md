<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Digital Store for Kirana Shops</title>
  <style>
    body {
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
    }
    .container {
      max-width: 960px;
      margin: auto;
    }
    h1, h2, h3 {
      color: #f8fafc;
    }
    h1 {
      font-size: 2.8rem;
      margin-bottom: 10px;
    }
    h2 {
      margin-top: 40px;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
    }
    p {
      color: #cbd5f5;
    }
    .badge {
      display: inline-block;
      background: #22c55e;
      color: #022c22;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-top: 10px;
    }
    .warning {
      background: #1e293b;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 6px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    code {
      background: #020617;
      padding: 4px 8px;
      border-radius: 6px;
      color: #7dd3fc;
    }
    pre {
      background: #020617;
      padding: 16px;
      border-radius: 10px;
      overflow-x: auto;
    }
    footer {
      margin-top: 60px;
      font-size: 0.9rem;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">

    <h1>🛒 Digital Store for Kirana Shops</h1>
    <p>
      A modern, lightweight digital commerce platform built specifically for
      <strong>local kirana shops</strong> — not enterprises, not malls, not hype.
    </p>
    <span class="badge">User Panel: 70% Complete</span>

    <h2>🚀 What This Is</h2>
    <p>
      This project helps kirana shop owners go digital without drowning in
      complex dashboards or expensive SaaS tools.
    </p>
    <p>
      It focuses on <strong>speed, simplicity, and mobile-first usability</strong>,
      because that’s what actually matters on the ground.
    </p>

    <h2>📊 Current Project Status</h2>
    <div class="warning">
      <p>
        <strong>⚠️ Important:</strong><br/>
        The user-facing experience is mostly complete (~70%).  
        The admin panel is under active development and will be completed next.
      </p>
    </div>

    <h2>✨ Features</h2>

    <h3>👥 User Panel</h3>
    <ul>
      <li>📦 Product listing with categories</li>
      <li>🔍 Product detail views</li>
      <li>🛒 Cart and checkout flow</li>
      <li>📱 Mobile-first responsive UI</li>
    </ul>

    <h3>🛠️ Admin Panel (In Progress)</h3>
    <ul>
      <li>➕ Add / Edit / Remove products</li>
      <li>📊 Inventory management</li>
      <li>📬 Order management</li>
      <li>⚙️ Shop configuration</li>
    </ul>

    <h2>🧰 Tech Stack</h2>
    <ul>
      <li>⚡ Vite</li>
      <li>⚛️ React</li>
      <li>📘 TypeScript</li>
      <li>🎨 Tailwind CSS</li>
      <li>🧩 shadcn/ui</li>
    </ul>

    <h2>🧪 Local Development</h2>
    <p>Make sure Node.js (LTS) and npm are installed.</p>

    <pre><code>
git clone &lt;REPO_URL&gt;
cd &lt;PROJECT_NAME&gt;
npm install
npm run dev
    </code></pre>

    <h2>📁 Project Structure</h2>
    <pre><code>
src/
 ├─ components/   # Shared UI components
 ├─ user/         # User panel pages & logic
 ├─ admin/        # Admin panel pages & logic
 ├─ lib/          # Utilities & helpers
 ├─ styles/       # Global styles
 └─ main.tsx      # App entry point
    </code></pre>

    <h2>🛣️ Roadmap</h2>
    <ul>
      <li>✅ Complete admin panel core features</li>
      <li>🔐 Authentication & role-based access</li>
      <li>📈 Basic sales & order analytics</li>
      <li>🚀 Production-ready deployment</li>
    </ul>

    <h2>🧠 Philosophy</h2>
    <ul>
      <li>Build for real kirana shops, not pitch decks</li>
      <li>Clarity beats cleverness</li>
      <li>If it doesn’t help sell, it doesn’t ship</li>
    </ul>

    <footer>
      Made with intent, not buzzwords ⚡
    </footer>

  </div>
</body>
</html>