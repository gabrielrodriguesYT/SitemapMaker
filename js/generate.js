document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("sitemapForm");
  const generateButton = document.getElementById("generateButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsContent = document.getElementById("resultsContent");
  const copyButton = document.getElementById("copyButton");
  const downloadButton = document.getElementById("downloadButton");
  const errorAlert = document.getElementById("errorAlert");
  const successAlert = document.getElementById("successAlert");

  const API_URL = "https://sitemap-generator-nodejs-api.vercel.app/generate-sitemap"; // ajuste se usar hospedagem

  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const url = document.getElementById("websiteUrl").value.trim();

    if (!isValidUrl(url)) {
      errorAlert.style.display = "block";
      successAlert.style.display = "none";
      return;
    }

    errorAlert.style.display = "none";
    successAlert.style.display = "none";
    loadingIndicator.style.display = "block";
    generateButton.disabled = true;

    const options = {
      changeFreq: document.getElementById("changeFreq").value,
      priority: document.getElementById("priority").value,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...options }),
      });

      if (!response.ok) throw new Error("Erro ao gerar sitemap");

      const sitemapXml = await response.text();

      resultsContent.textContent = sitemapXml;
      resultsContainer.style.display = "block";
      successAlert.style.display = "block";
    } catch (err) {
      console.error(err);
      errorAlert.style.display = "block";
    }

    loadingIndicator.style.display = "none";
    generateButton.disabled = false;
  });

  copyButton.addEventListener("click", function () {
    navigator.clipboard.writeText(resultsContent.textContent);
    copyButton.textContent = "Copiado!";
    setTimeout(() => (copyButton.textContent = "Copiar"), 2000);
  });

  downloadButton.addEventListener("click", function () {
    const blob = new Blob([resultsContent.textContent], {
      type: "application/xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  });
});