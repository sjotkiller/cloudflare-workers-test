# Cloudflare Workers - Hello World med CI/CD

Dette projekt er min første Cloudflare Worker med automatisk deployment via GitHub Actions.

## Hvad jeg har lavet

### Del 1: Cloudflare Workers
- Installeret Wrangler CLI
- Oprettet en "Hello World" Worker
- Deployed til Cloudflare's edge network
- Worker URL: https://hello-world.testmej.workers.dev

### Del 2: Cloudflare Tunnel
- Installeret cloudflared
- Oprettet lokal test-server
- Lavet tunnel fra lokal PC til internettet
- Testet med to samtidige tunnels

### Del 3: Git og GitHub
- Installeret Git
- Oprettet GitHub repository
- Pushed kode til GitHub
- Repository: https://github.com/sjotkiller/cloudflare-workers-test

### Del 4: CI/CD med GitHub Actions
- Konfigureret Cloudflare API credentials
- Oprettet GitHub Actions workflow
- Automatisk deployment ved push til main branch

## Projekt struktur
```
hello-world/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   └── index.js                # Worker kode
├── wrangler.jsonc              # Cloudflare konfiguration
├── package.json
└── README.md
```

## Teknologier brugt

- **Cloudflare Workers** - Serverless edge computing
- **Wrangler** - Cloudflare CLI tool
- **cloudflared** - Tunnel værktøj
- **Git** - Version control
- **GitHub** - Code hosting
- **GitHub Actions** - CI/CD pipeline

## Kommandoer jeg lærte

### Wrangler (Cloudflare Workers)
```bash
npm install -g wrangler          # Installer Wrangler
wrangler --version               # Tjek version
wrangler login                   # Log ind til Cloudflare
wrangler init hello-world        # Opret nyt projekt
wrangler dev                     # Test lokalt
wrangler deploy                  # Deploy til Cloudflare
wrangler tail                    # Se live logs
wrangler delete <worker-name>    # Slet worker
```

### Cloudflared (Tunnel)
```bash
cloudflared --version                        # Tjek version
cloudflared tunnel --url http://localhost:8000   # Start tunnel
```

### Git
```bash
git init                         # Initialiser repository
git config --global user.name    # Sæt navn
git config --global user.email   # Sæt email
git add .                        # Tilføj alle filer
git commit -m "besked"           # Gem ændringer
git push                         # Push til GitHub
git status                       # Se status
```

### Node.js
```bash
npx http-server -p 8000          # Start simpel webserver
npm install                      # Installer dependencies
```

## Workflow (CI/CD)

1. **Lav ændringer lokalt** i `src/index.js`
2. **Commit ændringerne:**
```bash
   git add .
   git commit -m "Beskrivelse af ændring"
```
3. **Push til GitHub:**
```bash
   git push
```
4. **GitHub Actions deployer automatisk** til Cloudflare
5. **Worker er live** på internettet!

## Secrets konfigureret

- `CLOUDFLARE_API_TOKEN` - API token til deployment
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID

## Hvad jeg lærte

### Cloudflare Workers
- Serverless funktioner der kører på edge
- Hurtig global distribution (300+ datacentre)
- Gratis tier: 100.000 requests/dag
- Perfekt til APIs, redirects, edge computing

### Cloudflare Tunnel
- Sikker forbindelse fra lokal PC til internettet
- Ingen port forwarding nødvendigt
- Perfekt til udvikling og test
- Kan køre flere tunnels samtidigt

### CI/CD
- Automatisk deployment ved code changes
- GitHub Actions kører workflow
- Ingen manuel deployment nødvendig
- Professional development workflow

## Næste skridt?

- [ ] Lave et API endpoint
- [ ] Håndtere POST requests
- [ ] Tilføje environment variables
- [ ] Integrere med database (KV, D1, osv.)
- [ ] Tilføje testing

## Links

- Worker: https://hello-world.testmej.workers.dev
- GitHub: https://github.com/sjotkiller/cloudflare-workers-test
- Cloudflare Dashboard: https://dash.cloudflare.com

## Dato

Projekt påbegyndt: 16. februar 2026

---

**Made with ☕ and Claude**
