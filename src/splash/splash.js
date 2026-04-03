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

  function startUpdateCheck() {
    setStatus('Verification des mises a jour...');

    // Listen for update events
    window.launcher.update.onNotAvailable(function () {
      if (updateDone) return;
      updateDone = true;
      setStatus('A jour !');
      setTimeout(navigateOut, 500);
    });

    window.launcher.update.onAvailable(function (data) {
      setStatus('Mise a jour ' + (data.version || '') + ' disponible...');
    });

    window.launcher.update.onDownloadProgress(function (data) {
      setStatus('Telechargement de la mise a jour... ' + (data.percent || 0) + '%');
    });

    window.launcher.update.onDownloaded(function (data) {
      if (updateDone) return;
      updateDone = true;
      setStatus('Installation de la mise a jour ' + (data.version || '') + '...');
      // Auto-restart to install
      setTimeout(function () {
        window.launcher.update.install();
      }, 1000);
    });

    window.launcher.update.onError(function () {
      if (updateDone) return;
      updateDone = true;
      // Update check failed (no internet, dev mode, etc.) — continue normally
      setTimeout(navigateOut, 300);
    });

    // Trigger the check
    window.launcher.update.check().catch(function () {
      // In dev mode or no internet — just continue
      if (!updateDone) {
        updateDone = true;
        setTimeout(navigateOut, 300);
      }
    });

    // Safety timeout: if no response after 10s, continue anyway
    setTimeout(function () {
      if (!updateDone) {
        updateDone = true;
        navigateOut();
      }
    }, 10000);
  }

  // Start after a short delay for the UI to render
  setTimeout(function () {
    setStatus('Demarrage...');
    setTimeout(startUpdateCheck, 500);
  }, 400);
})();
