// ============================================================
// Splash Screen Logic
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

  // Loading steps
  var steps = [
    { text: 'Demarrage...', delay: 600 },
    { text: 'Verification des mises a jour...', delay: 800 },
    { text: 'Verification de la session...', delay: 800 },
    { text: 'Chargement...', delay: 600 },
  ];

  var currentStep = 0;

  function nextStep() {
    if (currentStep < steps.length) {
      statusText.style.opacity = '0';
      setTimeout(function () {
        statusText.textContent = steps[currentStep].text;
        statusText.style.opacity = '1';
        currentStep++;
        if (currentStep < steps.length) {
          setTimeout(nextStep, steps[currentStep - 1].delay);
        } else {
          // All steps done, check session and navigate
          setTimeout(checkSessionAndNavigate, steps[currentStep - 1].delay);
        }
      }, 200);
    }
  }

  function checkSessionAndNavigate() {
    if (!window.launcher || !window.launcher.auth) {
      setTimeout(function () {
        window.launcher.nav.goLogin();
      }, 500);
      return;
    }

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

  // Start the loading sequence
  setTimeout(nextStep, 400);
})();
