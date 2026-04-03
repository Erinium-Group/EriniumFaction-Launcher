// ============================================================
// Splash Screen Logic — with real auto-updater integration
// ============================================================

(function () {
  var statusText = document.getElementById('statusText');
  var versionText = document.getElementById('versionText');

  // Set version
  if (window.launcher && window.launcher.app) {
    window.launcher.app.getVersion().then(function (v) {
      versionText.textContent = 'v' + v;
    });
  }

  function setStatus(text) {
    statusText.style.opacity = '0';
    setTimeout(function () {
      statusText.textContent = text;
      statusText.style.opacity = '1';
    }, 150);
  }

  function navigateOut() {
    if (!window.launcher || !window.launcher.auth) {
      window.launcher.nav.goLogin();
      return;
    }

    setStatus('Chargement...');

    window.launcher.auth.getSession().then(function (session) {
      if (session && session.valid) {
        window.launcher.nav.goMain();
      } else {
        document.getElementById('splash').style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(function () {
          window.launcher.nav.goLogin();
        }, 300);
      }
    }).catch(function () {
      window.launcher.nav.goLogin();
    });
  }

  // ---- Auto-updater flow ----
  var updateDone = false;
  var isDownloading = false;

  function finish() {
    if (updateDone) return;
    updateDone = true;
    navigateOut();
  }

  function startUpdateCheck() {
    setStatus('Verification des mises a jour...');

    // No update available — continue normally
    window.launcher.update.onNotAvailable(function () {
      if (updateDone) return;
      setStatus('A jour !');
      setTimeout(finish, 400);
    });

    // Update found — wait for download
    window.launcher.update.onAvailable(function (data) {
      if (updateDone) return;
      isDownloading = true;
      setStatus('Mise a jour ' + (data.version || '') + ' disponible...');
    });

    // Download progress
    window.launcher.update.onDownloadProgress(function (data) {
      if (updateDone) return;
      isDownloading = true;
      var pct = data.percent || 0;
      setStatus('Telechargement de la mise a jour... ' + pct + '%');
    });

    // Download complete — install and restart
    window.launcher.update.onDownloaded(function (data) {
      if (updateDone) return;
      updateDone = true;
      setStatus('Installation de la mise a jour ' + (data.version || '') + '...');
      setTimeout(function () {
        window.launcher.update.install();
      }, 800);
    });

    // Error — continue normally
    window.launcher.update.onError(function (data) {
      if (updateDone) return;
      console.error('[Splash] Update error:', data.message);
      // If we were downloading, the error is real — show it briefly then continue
      if (isDownloading) {
        setStatus('Erreur de mise a jour');
        setTimeout(finish, 1500);
      } else {
        // Check error, probably no internet or dev mode — just continue
        finish();
      }
    });

    // Trigger the check
    window.launcher.update.check().catch(function () {
      // Dev mode or no internet — just continue
      finish();
    });

    // Safety timeout: 60s for download, 8s if not downloading
    setTimeout(function () {
      if (!updateDone && !isDownloading) {
        console.warn('[Splash] Update check timeout — continuing');
        finish();
      }
    }, 8000);

    // Hard timeout: 60s max no matter what
    setTimeout(function () {
      if (!updateDone) {
        console.warn('[Splash] Hard timeout — continuing');
        finish();
      }
    }, 60000);
  }

  // Start after a short delay for the UI to render
  setTimeout(function () {
    setStatus('Demarrage...');
    setTimeout(startUpdateCheck, 400);
  }, 300);
})();
