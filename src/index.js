export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ip = request.headers.get('CF-Connecting-IP');
    const country = request.cf?.country;
    const userAgent = request.headers.get('User-Agent');
    
    // ============================================
    // REGEL 1: Geographic Blocking
    // ============================================
    const blockedCountries = ['CN', 'RU', 'KP', 'IR'];
    if (blockedCountries.includes(country)) {
      return new Response(
        JSON.stringify({
          error: 'Access Denied',
          reason: 'Geographic restriction',
          country: country
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // ============================================
    // REGEL 2: Block Bots
    // ============================================
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'curl', 'wget', 'python-requests'
    ];
    
    const isBot = botPatterns.some(pattern => 
      userAgent?.toLowerCase().includes(pattern)
    );
    
    if (isBot && url.pathname === '/api') {
      return new Response('Bots not allowed on API', { 
        status: 403 
      });
    }
    
    // ============================================
    // REGEL 3: HTTP Method Filtering
    // ============================================
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(request.method)) {
      return new Response(
        `Method ${request.method} not allowed`, 
        { status: 405 }
      );
    }
    
    // ============================================
    // REGEL 4: URL Path Blocking
    // ============================================
    const blockedPaths = ['/admin', '/.env', '/wp-admin'];
    if (blockedPaths.some(path => url.pathname.startsWith(path))) {
      return new Response('Path blocked', { status: 403 });
    }
    
    // ============================================
    // REGEL 5: SQL Injection Detection
    // ============================================
    const sqlInjectionPatterns = [
      'SELECT', 'UNION', 'DROP', 'INSERT', '--', ';'
    ];
    
    const queryString = url.search.toUpperCase();
    const hasSQLInjection = sqlInjectionPatterns.some(pattern =>
      queryString.includes(pattern)
    );
    
    if (hasSQLInjection) {
      return new Response('Potential SQL injection detected', {
        status: 400
      });
    }
    
    // ============================================
    // ACCESS GRANTED - Vis info
    // ============================================
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Firewall Protected</title>
        <style>
          body { 
            font-family: monospace; 
            padding: 40px; 
            background: #1a1a1a; 
            color: #00ff00; 
          }
          .info { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 10px 0;
          }
          h1 { color: #00ff00; }
          ul { line-height: 1.8; }
        </style>
      </head>
      <body>
        <h1>✅ Access Granted</h1>
        <div class="info">
          <h2>Your Request Info:</h2>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Country:</strong> ${country}</p>
          <p><strong>Path:</strong> ${url.pathname}</p>
          <p><strong>Method:</strong> ${request.method}</p>
        </div>
        
        <div class="info">
          <h2>🔥 Active Firewall Rules:</h2>
          <ul>
            <li>🌍 Geographic blocking (CN, RU, KP, IR)</li>
            <li>🤖 Bot detection and blocking on /api</li>
            <li>📝 HTTP method filtering (GET, HEAD, OPTIONS only)</li>
            <li>🚫 Path blocking (/admin, /.env, /wp-admin)</li>
            <li>💉 SQL injection detection</li>
          </ul>
        </div>
        
        <div class="info">
          <h2>🧪 Test the firewall:</h2>
          <ul>
            <li><a href="/admin" style="color: #00ff00;">Try /admin (blocked)</a></li>
            <li><a href="/.env" style="color: #00ff00;">Try /.env (blocked)</a></li>
            <li><a href="/?query=SELECT * FROM users" style="color: #00ff00;">Try SQL injection (blocked)</a></li>
          </ul>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};