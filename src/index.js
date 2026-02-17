export default {
  async fetch(request, env, ctx) {
    
    // Hent firewall regler fra Cloudflare API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/gateway/rules`,
      {
        headers: {
          'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    const rules = data.result || [];

    // Lav HTML side
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
          <p><strong>Opdateret:</strong> ${new Date(rule.updated_at).toLocaleString('da-DK')}</p>
          <p><strong>Expression:</strong> <code>${rule.traffic || 'Ingen'}</code></p>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <title>🔥 Cloudflare Firewall Regler</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: monospace;
            background: #0f0f0f;
            color: #e0e0e0;
            padding: 40px;
          }

          h1 {
            color: #f6821f;
            font-size: 2em;
            margin-bottom: 10px;
          }

          .subtitle {
            color: #888;
            margin-bottom: 30px;
          }

          .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-box {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 15px 25px;
            text-align: center;
          }

          .stat-box .number {
            font-size: 2em;
            color: #f6821f;
            font-weight: bold;
          }

          .stat-box .label {
            color: #888;
            font-size: 0.8em;
          }

          .rule {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: border-color 0.2s;
          }

          .rule:hover {
            border-color: #f6821f;
          }

          .rule-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
          }

          .rule-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #fff;
            flex: 1;
          }

          .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
          }

          .active { background: #1a3a1a; color: #00ff00; }
          .inactive { background: #3a1a1a; color: #ff4444; }
          .action-block { background: #3a1a1a; color: #ff4444; }
          .action-allow { background: #1a3a1a; color: #00ff00; }

          .rule-details p {
            margin: 5px 0;
            color: #aaa;
            font-size: 0.9em;
          }

          .rule-details code {
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 4px;
            color: #f6821f;
            font-size: 0.85em;
          }

          .updated {
            text-align: center;
            color: #555;
            margin-top: 30px;
            font-size: 0.8em;
          }
        </style>
      </head>
      <body>
        <h1>🔥 Cloudflare Firewall Regler</h1>
        <p class="subtitle">Live oversigt over dine Zero Trust Gateway regler</p>

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

        ${rulesHTML || '<p style="color:#888">Ingen regler fundet</p>'}

        <p class="updated">Sidst opdateret: ${new Date().toLocaleString('da-DK')}</p>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};