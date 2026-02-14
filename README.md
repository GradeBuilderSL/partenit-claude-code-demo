# 🔒 Partenit Warehouse Safety - Interactive Demo

**Interactive warehouse robot game demonstrating the Partenit Safety Layer**

🏆 **Built for [AI Meets Robotics Hackathon](https://lablab.ai/)** by lablab.ai

---

## 🎮 What is This?

This is an interactive demo game where you control warehouse robots and see how the **Partenit Safety Layer** protects workers in real-time. The game demonstrates:

- **Natural language control** - Command robots using plain English
- **Real-time safety decisions** - Watch the trust layer ALLOW, MODIFY, or BLOCK unsafe actions
- **Multi-robot coordination** - Manage 2 robots with swarm intelligence
- **Mission objectives** - Earn $500 in 5 minutes with 0 safety violations

---

## 🚀 Quick Start

### 1. Get API Keys

#### LLM API Key (choose one)
- **Google Gemini**: Get your key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **OpenAI**: Get your key at [OpenAI Platform](https://platform.openai.com/api-keys)

### 2. Run Locally

```bash
# Clone the repository
git clone <repository-url>
cd partenit-warehouse-game

# Option 1: Python HTTP server
python3 -m http.server 8080

# Option 2: Node.js serve
npx serve .

# Option 3: Any other static file server
```

### 3. Configure & Play

1. Open http://localhost:8080 in your browser
2. Select your **LLM provider** (Gemini or OpenAI)
3. Enter your **LLM API key**
4. Click **"Save & Start"**
5. Click **"New Game"** to begin!

---

## 🎯 How to Play

### Objective
**Earn $500 in 5 minutes with 0 safety violations**

### Game Mechanics

- **Delivery Tasks**: Robots pick boxes by weight (max 15 kg, max 3 boxes per trip)
- **Revenue**: Earn **$10 per kg** delivered to the bay (e.g., 4 kg → $40, 10 kg → $100)
- **Safety**: Stay away from workers to maintain safety score. Collisions cost **$300**
- **Battery**: Keep batteries above **15%**. At 0%, robot is blocked and rescue costs **$500**

### Controls

**Chat Commands:**
- `Go charge` - Send robot to charging station
- `Pick from shelf 1` - Pick up boxes from specific shelf
- `Status` - Get robot status
- `Pause` / `Resume` - Control robot operation
- `Drop task T1` - Release task to pool for other robot

**Quick Actions:**
- Use the quick action buttons for common commands
- Select target robot (R1/R2) before sending commands
- Adjust strategy slider: Safe (slower, cautious) ↔ Fast (faster, risky)

### Trust Layer Decisions

The Partenit Safety Layer evaluates every robot action:

- ✅ **ALLOW** - Action is safe, proceed as planned
- ⚠️ **MODIFY** - Action adjusted for safety (e.g., slower speed, different path)
- 🛑 **BLOCK** - Action is unsafe, robot stops

Watch the **Reasoning Engine** panel to see real-time safety decisions!

---

## 🏗️ Architecture

This demo uses:

- **Frontend**: Pure HTML/CSS/JavaScript (no frameworks)
- **Backend API**: Hosted at http://45.63.65.41
- **Safety Layer**: Mathematical constraints + LLM reasoning
- **LLM**: Your own API key (Gemini or OpenAI)

### Cost Model

- **Mathematical Safety**: FREE (pure math, no LLM)
- **Natural Language Commands**: Uses YOUR LLM key (you pay only for what you use)
- **Session Management**: FREE
- **Typical cost**: ~$0.01-0.05 per game session

---

## 📚 API Documentation

- **Swagger UI**: http://45.63.65.41/docs
- **OpenAPI Spec**: http://45.63.65.41/openapi.json

---

## 🏢 About Partenit

Partenit provides **Robotic Safety Compliance as a Service** - a trust layer that ensures robots operate safely around humans in warehouses, factories, and other environments.

### Key Features

- **Mathematical safety constraints** (no AI/ML in critical path)
- **Real-time decision evaluation** (ALLOW/MODIFY/BLOCK)
- **Regulatory compliance** (OSHA, ISO, vendor specs)
- **Audit trail** with cryptographic proof
- **Natural language interface** for operators

### Contact & Links

- **Website**: [partenit.io](https://partenit.io/)
- **LinkedIn**: [linkedin.com/company/partenit](https://www.linkedin.com/company/partenit/)
- **Email**: evgeny.nelepko@partenit.io

---

## 🏆 Hackathon

This project was built for the **AI Meets Robotics Hackathon** organized by [lablab.ai](https://lablab.ai/).

**Theme**: Combining AI/LLM capabilities with robotic systems to solve real-world problems.

**Our Solution**: A safety layer that makes warehouse robots safer and easier to control through natural language, while maintaining mathematical guarantees for safety-critical decisions.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is a hackathon demo project. For production use cases or partnerships, please contact us at evgeny.nelepko@partenit.io.

---

## 🐛 Troubleshooting

### "Configuration required" modal won't close
- Make sure you've entered your LLM API key
- Check browser console for errors
- Try refreshing the page

### Game doesn't start
- Check that your LLM API key has available quota
- Open browser DevTools → Network tab to see API responses

### Robots don't respond to commands
- Check the chat panel for error messages
- Verify your LLM provider is selected correctly
- Ensure you have internet connection (API is remote)

### CORS errors
- The API at http://45.63.65.41 should have CORS enabled
- If you see CORS errors, contact iuliia.gorshkova@partenit.io

---

**Made with ❤️ for safer human-robot collaboration**
