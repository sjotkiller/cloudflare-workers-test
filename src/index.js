export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Hent firewall regler
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

    // Hent Gateway logs (aktivitet)
    const logsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/gateway/logs`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const logsData = await logsResponse.json();
    const logs = logsData.result || [];

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
          <p><strong>Expression:</strong> <code>${rule.traffic || 'Ingen'}</code></p>
        </div>
      </div>
    `).join('');

    // HTML for logs
    const logsHTML = logs.length > 0 ? logs.slice(0, 50).map(log => `
      <div class="log-entry">
        <div class="log-header">
          <span class="log-time">${new Date(log.timestamp).toLocaleString('da-DK')}</span>
          <span class="badge action-${log.action || 'unknown'}">${log.action || 'UNKNOWN'}</span>
        </div>
        <div class="log-details">
          <p><strong>Type:</strong> ${log.type || 'N/A'}</p>
          <p><strong>Besked:</strong> ${log.message || 'Ingen detaljer'}</p>
        </div>
      </div>
    `).join('') : '<p class="no-data">Ingen logs tilgængelige endnu</p>';

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
            min-width: 150px;
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
          .action-unknown { background: #3a3a1a; color: #ffaa00; }

          .rule-details, .log-details {
            color: #aaa;
            font-size: 0.9em;
          }

          .rule-details p, .log-details p {
            margin: 5px 0;
          }

          .rule-details code {
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 4px;
            color: #f6821f;
            font-size: 0.85em;
          }

          .no-data {
            text-align: center;
            color: #666;
            padding: 40px;
            font-size: 1.1em;
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
          <p class="subtitle">Live oversigt over Zero Trust Gateway regler & aktivitet</p>

          <div class="tabs">
            <button class="tab active" onclick="switchTab('rules')">📊 Firewall Regler</button>
            <button class="tab" onclick="switchTab('logs')">📋 Aktivitets Logs</button>
          </div>

          <div id="rules-tab" class="tab-content active">
            <div class="stats">
              <div class="stat-box">
                <div class="number">${rules.length}</div>
                <div class="label">Totale regler</div>
              </div>
              <div class="stat-box">
                <div class="number">${rules.filter(r => r.enabled).length}</div>
                <div class="label">Aktive regler</div>
              </div>
              <div class="stat-box">
                <div class="number">${rules.filter(r => r.action === 'block').length}</div>
                <div class="label">Block regler</div>
              </div>
            </div>

            ${rulesHTML || '<p class="no-data">Ingen regler fundet</p>'}
          </div>

          <div id="logs-tab" class="tab-content">
            <div class="stats">
              <div class="stat-box">
                <div class="number">${logs.length}</div>
                <div class="label">Log entries</div>
              </div>
            </div>

            ${logsHTML}
          </div>

          <p class="updated">Sidst opdateret: ${new Date().toLocaleString('da-DK')}</p>
        </div>

        <script>
          function switchTab(tab) {
            // Skjul alle tabs
            document.querySelectorAll('.tab-content').forEach(el => {
              el.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(el => {
              el.classList.remove('active');
            });

            // Vis valgt tab
            if (tab === 'rules') {
              document.getElementById('rules-tab').classList.add('active');
              document.querySelectorAll('.tab')[0].classList.add('active');
            } else if (tab === 'logs') {
              document.getElementById('logs-tab').classList.add('active');
              document.querySelectorAll('.tab')[1].classList.add('active');
            }
          }
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};