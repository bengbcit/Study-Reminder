/* app.js — Main entry point: page routing, save settings, initialization */

const App = {
  currentPage: 'subjects',

  init() {
    loadLocal();
    Subjects.render();
    Remind.syncUI();
    I18n.updateSelects();
    document.getElementById('streakNum').textContent = S.streak;
    // Schedule browser banner reminder
    Remind.scheduleBanner();
  },

  showPage(name, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    btn.classList.add('active');
    this.currentPage = name;

    // Render page-specific content
    switch (name) {
      case 'report':   Report.render();  break;
      case 'calendar': Cal.render();     break;
      case 'stats':    Stats.render();   break;
      case 'rewards':  Rewards.render(); break;
      case 'timer':    Timer.render();   break;
    }
  },

  async saveSettings() {
    // Read remind settings
    Remind.readUI();

    // Persist locally
    saveLocal();

    // Push today's subjects to calendar as todo items
    Cal.syncToday();

    // Sync to Firestore if logged in
    if (window.Auth?.user) {
      await Auth.saveUserData();
    }

    showToast(t('save_ok'));

    // Reschedule banner if push is on
    Remind.scheduleBanner();
  },
};

// Bootstrap after Firebase is ready (auth.js fires App.init via onAuthStateChanged)
// If Firebase is not configured yet, fall back to local-only mode
window.addEventListener('load', () => {
  // Give Firebase 2 seconds to initialize; if auth gate is still visible, skip
  setTimeout(() => {
    if (document.getElementById('mainApp').style.display === 'none' &&
        document.getElementById('authGate').style.display !== 'none') {
      // Firebase not configured — run in demo/local mode
      console.warn('Firebase not configured. Running in local mode.');
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('mainApp').style.display  = 'block';
      App.init();
    }
  }, 2000);
});
