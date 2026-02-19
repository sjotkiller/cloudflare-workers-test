export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ip = request.headers.get('CF-Connecting-IP');
    const country = request.cf?.country;
    const userAgent = request.headers.get('User-Agent');
    
    let blocked = false;
    let blockReason = '';
    
    // ============================================
    // REGEL 1: Geographic Blocking
    // ============================================
    const blockedCountries = ['CN', 'RU', 'KP', 'IR'];
    if (blockedCountries.includes(country)) {
      blocked = true;
      blockReason = `Geographic restriction (${country})`;
    }
    
    // ============================================
    // REGEL 2: Block Bots on /api
    // ============================================
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests'];
    const isBot = botPatterns.some(pattern => userAgent?.toLowerCase().includes(pattern));
    
    if (!blocked && isBot && url.pathname === '/api') {
      blocked = true;
      blockReason = 'Bot detected on /api';
    }
    
    // ============================================
    // REGEL 3: HTTP Method Filtering
    // ============================================
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!blocked && !allowedMethods.includes(request.method)) {
      blocked = true;
      blockReason = `Method ${request.method} not allowed`;
    }
    
    // ============================================
    // REGEL 4: URL Path Blocking
    // ============================================
    const blockedPaths = ['/admin', '/.env', '/wp-admin'];
    if (!blocked && blockedPaths.some(path => url.pathname.startsWith(path))) {
      blocked = true;
      blockReason = `Path ${url.pathname} blocked`;
    }
    
    // ============================================
    // REGEL 5: SQL Injection Detection
    // ============================================
    const sqlInjectionPatterns = ['SELECT', 'UNION', 'DROP', 'INSERT', '--', ';'];
    const queryString = url.search.toUpperCase();
    const hasSQLInjection = sqlInjectionPatterns.some(pattern => queryString.includes(pattern));
    
    if (!blocked && hasSQLInjection) {
      blocked = true;
      blockReason = 'SQL injection detected';
    }
    
    // ============================================
    // LOG HVIS BLOKERET
    // ============================================
    if (blocked) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ip: ip,
        country: country,
        path: url.pathname,
        query: url.search,
        method: request.method,
        userAgent: userAgent,
        reason: blockReason,
        action: 'BLOCKED'
      };
      
      // Gem til KV storage
      const logKey = `log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await env.FIREWALL_LOGS.put(logKey, JSON.stringify(logEntry), {
        expirationTtl: 86400 // Logs slettes efter 24 timer
      });
      
      return new Response(
        JSON.stringify({
          error: 'Access Denied',
          reason: blockReason
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ============================================
    // HVIS IKKE BLOKERET - VIS DASHBOARD
    // ============================================
    
    // Hent firewall regler fra Cloudflare API
    const rulesResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/gateway/rules`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const rulesData = await rulesResponse.json();
    const rules = rulesData.result || [];

    // Hent logs fra KV
    const logsList = await env.FIREWALL_LOGS.list({ limit: 100 });
    const logs = [];
    
    for (const key of logsList.keys) {
      const logData = await env.FIREWALL_LOGS.get(key.name);
      if (logData) {
        logs.push(JSON.parse(logData));
      }
    }
    
    // Sorter logs (nyeste først)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // HTML for regler
    const rulesHTML = rules.map(rule => `
      <div class="rule">
        <div class="rule-header">
          <span class="rule-name">${rule.name}</span>
          <span class="badge ${rule.enabled ? 'active' : 'inactive'}">
            ${rule.enabled ? '✅ Aktiv' : '❌ Inaktiv'}
          </span>
          <span class="badge action-${rule.action}">
            ${rule.action.toUpperCase()}
          </span>
        </div>
        <div class="rule-details">
          <p><strong>ID:</strong> ${rule.id}</p>
          <p><strong>Oprettet:</strong> ${new Date(rule.created_at).toLocaleString('da-DK')}</p>
        </div>
      </div>
    `).join('');

    // HTML for Worker firewall logs
    const workerLogsHTML = logs.length > 0 ? logs.slice(0, 50).map(log => `
      <div class="log-entry blocked">
        <div class="log-header">
          <span class="log-time">🕒 ${new Date(log.timestamp).toLocaleString('da-DK')}</span>
          <span class="badge action-block">${log.action}</span>
        </div>
        <div class="log-details">
          <p><strong>🌍 Source:</strong> ${log.ip} ${log.country ? `(${log.country})` : ''}</p>
          <p><strong>📍 Path:</strong> ${log.path}${log.query || ''}</p>
          <p><strong>🚫 Reason:</strong> ${log.reason}</p>
          <p><strong>🔧 Method:</strong> ${log.method}</p>
        </div>
      </div>
    `).join('') : '<div class="no-data">Ingen blokeret trafik endnu. Worker firewall logger kun blokeret trafik.</div>';

    const html = `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔥 Cloudflare Firewall Dashboard</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
            background: #0f0f0f;
            color: #e0e0e0;
            padding: 20px;
          }

          .container {
            max-width: 1400px;
            margin: 0 auto;
          }

          h1 {
            color: #f6821f;
            font-size: 2.5em;
            margin-bottom: 10px;
          }

          .subtitle {
            color: #888;
            margin-bottom: 30px;
          }

          .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
          }

          .tab {
            padding: 12px 24px;
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
          }

          .tab:hover {
            color: #f6821f;
          }

          .tab.active {
            color: #f6821f;
            border-bottom-color: #f6821f;
          }

          .tab-content {
            display: none;
          }

          .tab-content.active {
            display: block;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-box {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }

          .stat-box .number {
            font-size: 2.5em;
            color: #f6821f;
            font-weight: bold;
          }

          .stat-box .label {
            color: #888;
            font-size: 0.9em;
            margin-top: 5px;
          }

          .rule, .log-entry {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: border-color 0.2s;
          }

          .rule:hover, .log-entry:hover {
            border-color: #f6821f;
          }

          .log-entry.blocked {
            border-left: 4px solid #ff4444;
          }

          .rule-header, .log-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
          }

          .rule-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #fff;
            flex: 1;
            min-width: 200px;
          }

          .log-time {
            font-size: 1em;
            color: #aaa;
            flex: 1;
            min-width: 200px;
          }

          .badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.75em;
            font-weight: bold;
            white-space: nowrap;
          }

          .active { background: #1a3a1a; color: #00ff00; }
          .inactive { background: #3a1a1a; color: #ff4444; }
          .action-block { background: #3a1a1a; color: #ff4444; }
          .action-allow { background: #1a3a1a; color: #00ff00; }

          .rule-details, .log-details {
            color: #aaa;
            font-size: 0.9em;
          }

          .rule-details p, .log-details p {
            margin: 5px 0;
          }

          .no-data {
            text-align: center;
            color: #666;
            padding: 40px;
            font-size: 1em;
            background: #1a1a1a;
            border-radius: 8px;
          }

          .updated {
            text-align: center;
            color: #555;
            margin-top: 30px;
            font-size: 0.8em;
          }

          @media (max-width: 768px) {
            h1 { font-size: 1.8em; }
            .stats { grid-template-columns: 1fr; }
            .tab { padding: 10px 16px; font-size: 0.9em; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔥 Cloudflare Firewall Dashboard</h1>
          <p class="subtitle">Live oversigt over Zero Trust Gateway regler & Worker firewall logs</p>

          <div class="tabs">
            <button class="tab active" onclick="switchTab('rules')">📊 Gateway Regler</button>
            <button class="tab" onclick="switchTab('logs')">📋 Worker Firewall Logs</button>
          </div>

          <div id="rules-tab" class="tab-content active">
            <div class="stats">
              <div class="stat-box">
                <div class="number">${rules.length}</div>
                <div class="label">Gateway regler</div>
              </div>
              <div class="stat-box">
                <div class="number">${rules.filter(r => r.enabled).length}</div>
                <div class="label">Aktive</div>
              </div>
              <div class="stat-box">
                <div class="number">${rules.filter(r => r.action === 'block').length}</div>
                <div class="label">Block regler</div>
              </div>
            </div>

            ${rulesHTML || '<p class="no-data">Ingen Gateway regler fundet</p>'}
          </div>

          <div id="logs-tab" class="tab-content">
            <div class="stats">
              <div class="stat-box">
                <div class="number">${logs.length}</div>
                <div class="label">Blokeret (24t)</div>
              </div>
              <div class="stat-box">
                <div class="number">${logs.filter(l => l.reason.includes('Geographic')).length}</div>
                <div class="label">Geographic blocks</div>
              </div>
              <div class="stat-box">
                <div class="number">${logs.filter(l => l.reason.includes('Path')).length}</div>
                <div class="label">Path blocks</div>
              </div>
            </div>

            ${workerLogsHTML}
          </div>

          <p class="updated">Sidst opdateret: ${new Date().toLocaleString('da-DK')} | Logs gemmes i 24 timer</p>
        </div>

       <script>
          function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => {
              el.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(el => {
              el.classList.remove('active');
            });
            if (tab === 'rules') {
              document.getElementById('rules-tab').classList.add('active');
              document.querySelectorAll('.tab')[0].classList.add('active');
            } else if (tab === 'logs') {
              document.getElementById('logs-tab').classList.add('active');
              document.querySelectorAll('.tab')[1].classList.add('active');
            }

            localStorage.setItem('activeTab', tab);
          }

          // Gendan aktiv fane efter reload
          const savedTab = localStorage.getItem('activeTab');
          if (savedTab) switchTab(savedTab);

          // Auto-refresh hver 30 sekunder
          setTimeout(() => location.reload(), 30000);
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};