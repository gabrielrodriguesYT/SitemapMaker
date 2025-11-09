document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('sitemapForm');
  const generateButton = document.getElementById('generateButton');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsContent = document.getElementById('resultsContent');
  const copyButton = document.getElementById('copyButton');
  const downloadButton = document.getElementById('downloadButton');
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');

  // Verifica se a URL é válida
  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Função que rastreia páginas do site
  async function crawlSite(baseUrl, limit = 50) {
    const visited = new Set();
    const toVisit = [baseUrl];
    const pages = [];

    while (toVisit.length && visited.size < limit) {
      const currentUrl = toVisit.shift();
      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);
      try {
        const response = await fetch(currentUrl);
        if (!response.ok) continue;

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Extrai data de modificação
        let lastmod = response.headers.get('last-modified');
        if (!lastmod) lastmod = new Date().toISOString().split('T')[0];
        else lastmod = new Date(lastmod).toISOString().split('T')[0];

        pages.push({
          loc: currentUrl,
          lastmod
        });

        // Pega todos os links internos
        const links = Array.from(doc.querySelectorAll('a[href]'))
          .map(a => new URL(a.getAttribute('href'), baseUrl).href)
          .filter(href => href.startsWith(baseUrl) && !visited.has(href) && !href.includes('#') && !href.includes('mailto:'));
        toVisit.push(...links);

      } catch (err) {
        console.warn('Erro ao rastrear', currentUrl, err);
      }
    }
    return pages;
  }

  // Gera o sitemap XML com base nas páginas rastreadas
  function buildSitemap(pages, options) {
    const xmlEntries = pages.map(page => `
  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${options.changeFreq}</changefreq>
    <priority>${options.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  // Evento do formulário
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const url = document.getElementById('websiteUrl').value.trim();

    if (!isValidUrl(url)) {
      errorAlert.style.display = 'block';
      successAlert.style.display = 'none';
      return;
    }

    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    loadingIndicator.style.display = 'block';
    generateButton.disabled = true;

    const options = {
      changeFreq: document.getElementById('changeFreq').value,
      priority: document.getElementById('priority').value
    };

    try {
      const pages = await crawlSite(url, 100); // Limite: 100 páginas
      const sitemapXml = buildSitemap(pages, options);

      resultsContent.textContent = sitemapXml;
      resultsContainer.style.display = 'block';
      successAlert.style.display = 'block';
    } catch (err) {
      console.error(err);
      errorAlert.style.display = 'block';
    }

    loadingIndicator.style.display = 'none';
    generateButton.disabled = false;
  });

  // Botão de copiar
  copyButton.addEventListener('click', function() {
    navigator.clipboard.writeText(resultsContent.textContent);
    copyButton.textContent = 'Copiado!';
    setTimeout(() => copyButton.textContent = 'Copiar', 2000);
  });

  // Botão de download
  downloadButton.addEventListener('click', function() {
    const blob = new Blob([resultsContent.textContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  });
});
