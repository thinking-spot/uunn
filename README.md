# uunn

**A secure worker coordination platform that makes it easy to form a union in any setting with any people.**

uunn is a privacy-first web platform that enables workers to coordinate on workplace issues without requiring formal unionization. We provide secure communication, action templates, and document generation tools that respect workers' right to organize.

## 🚀 Deploy to www.uunn.io

Ready to launch? Choose your path:

- **⚡ Quick Start** → [QUICKSTART.md](./QUICKSTART.md) - Launch in ~10 minutes
- **📖 Complete Guide** → [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment walkthrough
- **🌐 DNS Setup** → [docs/DNS-SETUP.md](./docs/DNS-SETUP.md) - Configure your domain
- **🔄 CI/CD Setup** → [docs/CI-CD-SETUP.md](./docs/CI-CD-SETUP.md) - Automated deployments

**Automated Scripts:**
```bash
./scripts/setup-database.sh  # Initialize D1 database
./scripts/deploy.sh          # Deploy to Cloudflare Pages
```

---

## 🎯 The Gap We Fill

Workers lack accessible, private tools to gauge support, coordinate demands, and build collective power. Existing solutions are either:

- **Employer-controlled** (Slack, Teams) - monitored and controlled by management
- **Require external organizers** (traditional unions) - inaccessible for many workers
- **Compromise privacy** (petition platforms) - data harvesting and public exposure

**uunn fills this gap** by providing purpose-built, privacy-preserving organizing tools that are accessible to all workers.

---

## ✨ Core Features

### 🔒 Secure Group Messaging

- End-to-end encrypted workplace discussions
- Pseudonymous participation to protect worker identity
- Server never sees message content—only encrypted data
- Client-side storage in IndexedDB

### 📋 Action Templates

- Pre-built frameworks for collective demands and petitions
- Proposal → Vote → Approval workflows
- Track support and coordinate collective action
- Encrypted voting for sensitive decisions

### 📄 Document Generation

- Generate petitions, grievance forms, and demand letters
- Legal education resources (Section 7 rights, NLRA protections)
- All documents created client-side—never touch the server
- Export as PDF or Markdown

### 👥 Transparent Invitations

- Workers invite coworkers using secure invite codes
- View who invited whom without revealing identities
- Builds trust through visible organizing network
- Code-based access control

### 🌐 Inter-Union Organizing

- Communicate between unions
- Coordinate actions across workplaces
- Consolidate unions for greater power
- Enable general strikes

---

## 🔐 Privacy Architecture

### Client-Side Encryption

- All sensitive data encrypted on user's device using Web Crypto API
- RSA-OAEP (2048-bit) for key exchange
- AES-GCM (256-bit) for message content
- PBKDF2 for password-based key derivation

### What the Server Sees

- ❌ **Never sees**: Messages, documents, worker identities, organizing activity
- ✅ **Only sees**: Encrypted metadata, group IDs, pseudonyms, timestamps

### Local Storage

- Messages and keys stored in IndexedDB (browser-local)
- No server-side message storage
- Data never leaves your device unencrypted

### Open Source

- Security-critical components are open source
- Community-auditable privacy practices
- Transparent development roadmap

---

## 🚀 How It Works

1. **Create a Workplace Group**
   A worker creates an encrypted group for their workplace using a pseudonym.

2. **Invite Coworkers**
   Share invite codes through trusted channels. Each invitation creates a visible node in the organizing graph.

3. **Discuss & Coordinate**
   Workers communicate privately about workplace issues. Messages are encrypted end-to-end.

4. **Take Action**
   Create proposals, gather votes, generate documents, coordinate actions, and communicate collective demands.

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Encryption**: Client-side E2E encryption (Web Crypto API)
- **Backend**: Cloudflare Workers (serverless, edge-deployed)
- **Database**: Cloudflare D1 (SQLite) for metadata only
- **Storage**: IndexedDB for client-side message caching
- **Deployment**: Cloudflare Pages with global CDN

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- A Cloudflare account (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/uunn.git
cd uunn

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Database Setup (Cloudflare D1)

```bash
# Create D1 database
wrangler d1 create uunn-db

# Run migrations
wrangler d1 execute uunn-db --file=./schema.sql
```

### Deployment

```bash
# Build for Cloudflare Pages
npm run pages:build

# Deploy to Cloudflare
npm run deploy
```

---

## 📚 Project Structure

```
uunn/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── create-group/      # Create group flow
│   ├── join/              # Join group flow
│   ├── groups/[id]/       # Group dashboard & messaging
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core libraries
│   ├── crypto.ts         # E2E encryption utilities
│   ├── auth.ts           # Authentication & identity
│   ├── storage.ts        # IndexedDB operations
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
├── public/               # Static assets
├── schema.sql            # D1 database schema
├── wrangler.toml         # Cloudflare configuration
└── README.md             # This file
```

---

## 🧪 Testing

```bash
# Run type checking
npm run build

# Run linting
npm run lint
```

---

## 🤝 Contributing

uunn is built by workers, for workers. We welcome contributions from the community!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Remember: we're building tools for worker empowerment

---

## ⚖️ Legal Protection

**Section 7 of the National Labor Relations Act (NLRA)** protects your right to engage in "concerted activity" for "mutual aid or protection"—even without a union.

Workers in the United States have the right to:

- Discuss wages, benefits, and working conditions
- Organize collectively to improve their workplace
- Coordinate on workplace issues without employer interference

**uunn supports workers' legally protected rights.**

---

## 🎯 Why uunn Matters

### Protected by Law

Section 7 of the NLRA protects workers' right to engage in "concerted activity" for "mutual aid or protection"—even without a union.

### Fills a Critical Gap

- **90% of US workers are not union members**
- Gig workers, contractors, and small shops lack organizing infrastructure
- Workers need tools to build power incrementally, not just binary union/no-union choices

### Built for Privacy

- Workers organize under surveillance—tools must protect them
- Open source architecture prevents backdoors
- Non-profit structure ensures no incentive to exploit user data

---

## 🏢 Business Model

uunn operates as a **non-profit** entity.

### Revenue Sources

- Foundation grants (labor-focused foundations)
- Individual donations from users and supporters
- Partnership fees from established unions (for lead referrals)

### What We Will Never Do

- ❌ Sell user data
- ❌ Surveillance capitalism
- ❌ Build employer-facing products
- ❌ Display advertising
- ❌ Charge workers for access

**No user fees—free for all workers.**

---

## 🎓 Learn More

- **Privacy Policy**: [/privacy](/privacy)
- **Terms of Service**: [/terms](/terms)
- **Legal Resources**: [/legal-resources](/legal-resources)
- **Section 7 Rights**: [NLRB Website](https://www.nlrb.gov/about-nlrb/rights-we-protect/the-law/employees/concerted-activity)

---

## 📧 Contact

- **Email**: support@uunn.org (coming soon)
- **GitHub**: [github.com/uunn](https://github.com/uunn)
- **Community**: Join a group to connect with other workers

---

## 📜 License

uunn is open source software released under the **MIT License**.

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with support from:

- The labor movement and worker organizers
- Privacy and security researchers
- Open source contributors
- Workers everywhere fighting for better conditions

---

## 🔮 Roadmap

### Phase 1: Foundation (Current)

- ✅ Core encryption and security
- ✅ Group creation and messaging
- ✅ Invite system
- 🚧 Action templates
- 🚧 Document generation

### Phase 2: Growth

- Multi-device sync
- Mobile apps (iOS, Android)
- Real-time message sync
- Enhanced action templates
- Offline-first architecture

### Phase 3: Movement Infrastructure

- Multi-workplace coordination
- Inter-union communication
- Legal resource library expansion
- Strike coordination tools
- General strike readiness

---

**Built by workers, for workers.**

**Organize. Coordinate. Build power.**
