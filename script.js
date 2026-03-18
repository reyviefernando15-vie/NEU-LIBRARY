/*
  NEU Library - Admin System
  (JavaScript moved out of HTML for separation of concerns)
*/

// --- FIREBASE CONFIG ---
// NOTE: Replace this config with your own Firebase project config.
//       The Google Sign-In will only work if you enable Authentication -> Sign-in method -> Google
//       and add your app's domain to Authorized domains.
const firebaseConfig = {
  apiKey: "AIzaSyB0xwF6fFbPD_zD6458t_19VWMwocQiV3I",
  authDomain: "sfdasdafd.firebaseapp.com",
  databaseURL: "https://sfdasdafd-default-rtdb.firebaseio.com",
  projectId: "sfdasdafd",
  storageBucket: "sfdasdafd.firebasestorage.app",
  messagingSenderId: "701386389930",
  appId: "1:701386389930:web:d1d08e0f520dd7770993d3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let trafficChart = null;
let hideTimeout = null;
let currentUser = null;

function updateGoogleSignupUI() {
  const userInfo = document.getElementById('googleUserInfo');
  const userName = document.getElementById('googleUserName');
  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPhoto = document.getElementById('regPhoto');
  const logoutBtn = document.getElementById('logout-btn');

  if (!currentUser) {
    userInfo.classList.add('hidden');
    userName.innerText = '';
    regEmail.value = '';
    regPhoto.value = '';
    if (logoutBtn) logoutBtn.classList.add('hidden');
    return;
  }

  userInfo.classList.remove('hidden');
  userName.innerText = currentUser.displayName || currentUser.email || 'Google User';
  regName.value = currentUser.displayName || regName.value;
  regEmail.value = currentUser.email || '';
  regPhoto.value = currentUser.photoURL || '';
  if (logoutBtn) logoutBtn.classList.remove('hidden');
}

auth.onAuthStateChanged(user => {
  currentUser = user;
  updateGoogleSignupUI();
});

function handleTimeIn() {
  const rawId = document.getElementById('idInput').value.trim();
  const reason = document.getElementById('visitReason').value;
  const sId = rawId.replace(/\./g, '_');

  db.ref('users/' + sId).once('value', snap => {
    if (!snap.exists()) return alert('Not Registered!');
    const u = snap.val();
    const now = new Date();
    const log = {
      id: rawId,
      name: u.name,
      photo: u.photo,
      reason: reason,
      dept: u.dept,
      type: u.type,
      course: u.course,
      year: u.year || '',
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day: now.toLocaleDateString('en-US', { weekday: 'short' })
    };

    db.ref('logs').push(log).then(() => {
      const profileDiv = document.getElementById('userProfile');
      profileDiv.style.display = 'block';
      document.getElementById('dispPic').src = u.photo;
      document.getElementById('dispName').innerText = u.name;
      document.getElementById('dispDetails').innerText = u.course;
      document.getElementById('dispYear').innerText = u.year || '';
      document.getElementById('idInput').value = '';

      if (hideTimeout) clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => { profileDiv.style.display = 'none'; }, 6000);

      db.ref('logs').orderByChild('id').equalTo(rawId).limitToLast(5).on('value', s => {
        let h = '';
        let a = [];
        s.forEach(c => a.push(c.val()));
        a.reverse().forEach(l => { h += `<tr><td>${l.date}</td><td>${l.time}</td></tr>`; });
        document.getElementById('logBody').innerHTML = h;
      });
    });
  });
}

function handleGoogleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      console.log("SUCCESS:", user);

      alert("Welcome " + user.displayName);
    })
    .catch((err) => {
      console.error("FULL ERROR:", err);

      if (err.code === 'auth/configuration-not-found') {
        alert(
          "Google Sign-in Error: configuration not found.\n" +
          "Please update firebaseConfig in script.js with your Firebase project settings, " +
          "and enable Google Sign-In in the Firebase console (Authentication → Sign-in method)."
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        alert("ERROR: Domain not authorized. Add your site to Firebase Auth Authorized Domains.");
      } else if (err.code === 'auth/operation-not-allowed') {
        alert("Enable Google Sign-In in Firebase (Authentication → Sign-in method).");
      } else {
        alert("Google Sign-in Error: " + err.message);
      }
    });
}

function handleGoogleSignOut() {
  auth.signOut();
}

function handleSignUp() {
  const id = document.getElementById('regID').value.trim().replace(/\./g, '_');
  if (!id) return alert('Please enter ID Number');

  if (!currentUser) {
    return alert('Please sign in with Google first.');
  }

  const data = {
    googleUid: currentUser.uid,
    email: currentUser.email || '',
    name: document.getElementById('regName').value,
    type: document.getElementById('regType').value,
    dept: document.getElementById('regDept').value,
    year: document.getElementById('regYear').value,
    course: document.getElementById('regCourse').value,
    photo: document.getElementById('regPhoto').value || document.getElementById('regBase64').value || 'https://via.placeholder.com/150'
  };

  db.ref('users/' + id).set(data).then(() => { alert('Registration Success!'); switchTab('timein'); });
}

function loadLiveLogs() {
  const rFilt = document.getElementById('filterReason').value;
  const dFilt = document.getElementById('filterDept').value;
  const tFilt = document.getElementById('filterType').value;

  db.ref('logs').on('value', snap => {
    let h = '';
    let count = 0;
    let logsArr = [];

    snap.forEach(c => {
      const l = c.val();
      if ((rFilt === 'All' || l.reason.includes(rFilt)) &&
          (dFilt === 'All' || l.dept === dFilt) &&
          (tFilt === 'All' || l.type === tFilt)) {
        logsArr.push({ key: c.key, data: l });
        count++;
      }
    });

    logsArr.reverse().forEach(item => {
      const l = item.data;
      h += `<tr>
        <td><input type="checkbox" class="log-check" data-log-key="${item.key}"></td>
        <td style="text-align:left;">
          <img src="${l.photo}" class="admin-thumb">
          <b>${l.name}</b> <br><small>${l.course} | ${l.dept}</small>
        </td>
        <td style="color:var(--neu-green); font-weight:bold;">${l.time}</td>
      </tr>`;
    });

    document.getElementById('adminLogsBody').innerHTML = h || '<tr><td colspan="3">No History</td></tr>';
    document.getElementById('countDisplay').innerText = `DISPLAYING: ${count} RECORDS`;

    document.querySelectorAll('.log-check').forEach(cb => cb.addEventListener('change', updateBulkBtn));
    updateBulkBtn();
  });
}

function switchTab(tab) {
  const container = document.getElementById('mainContainer');

  // Admin view is accessible without a password.
  if (tab === 'admin') container.classList.add('admin-mode');
  else container.classList.remove('admin-mode');

  // Hide any auth sections when switching to other tabs
  document.getElementById('section-login').classList.add('hidden');
  document.getElementById('section-signup').classList.add('hidden');

  // Show auth toggle + panels only on timein view
  const authPanel = document.getElementById('authPanel');
  if (authPanel) authPanel.style.display = tab === 'timein' ? 'block' : 'none';

  document.getElementById('section-timein').classList.add('hidden');
  document.getElementById('section-admin').classList.add('hidden');
  document.getElementById('section-' + tab).classList.remove('hidden');

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const activeLink = document.getElementById('link-' + (tab === 'admin' ? 'admin' : 'timein'));
  if (activeLink) activeLink.classList.add('active');

  if (tab === 'admin') { loadAnalytics(); loadUserDB(); loadLiveLogs(); }
}

function loadUserDB() {
  db.ref('users').on('value', snap => {
    let h = '';
    snap.forEach(c => {
      h += `<tr>
        <td style="text-align:left;"><img src="${c.val().photo}" class="admin-thumb">${c.val().name}</td>
        <td>${c.val().dept}</td>
        <td><button class="btn-delete" data-user-id="${c.key}">Del</button></td>
      </tr>`;
    });

    document.getElementById('userListBody').innerHTML = h;
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.userId));
    });
  });
}

function updateBulkBtn() {
  const checkboxes = document.querySelectorAll('.log-check:checked');
  document.getElementById('btnBulkDelete').style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
}

function deleteSelectedLogs() {
  const checkboxes = document.querySelectorAll('.log-check:checked');
  if (confirm(`Delete ${checkboxes.length} logs?`)) {
    checkboxes.forEach(cb => db.ref('logs/' + cb.dataset.logKey).remove());
  }
}

function toggleSelectAll(source) {
  const checkboxes = document.querySelectorAll('.log-check');
  checkboxes.forEach(cb => { cb.checked = source.checked; });
  updateBulkBtn();
}

function clearLogs() { if (confirm('Clear all logs?')) db.ref('logs').remove(); }
function deleteUser(id) { if (confirm('Delete this user permanently?')) db.ref('users/' + id).remove(); }

function loadAnalytics() {
  db.ref('logs').on('value', snap => {
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    snap.forEach(c => { const d = c.val().day; if (counts[d] !== undefined) counts[d]++; });

    const ctx = document.getElementById('trafficChart').getContext('2d');
    if (trafficChart) trafficChart.destroy();
    trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          label: 'Logs',
          data: Object.values(counts),
          borderColor: '#006400',
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(0,100,0,0.15)'
        }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  });
}

function switchAuthTab(tab) {
  document.getElementById('authSignUp').classList.toggle('active', tab === 'signup');
  document.getElementById('authLogIn').classList.toggle('active', tab === 'login');
  document.getElementById('section-signup').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('section-login').classList.toggle('hidden', tab !== 'login');
}

function initEventListeners() {
  document.getElementById('link-timein').addEventListener('click', () => switchTab('timein'));
  document.getElementById('link-admin').addEventListener('click', () => switchTab('admin'));
  document.getElementById('logout-btn').addEventListener('click', () => {
    handleGoogleSignOut();
    switchTab('timein');
  });
  document.getElementById('btnGoogleSignIn').addEventListener('click', handleGoogleSignIn);
  document.getElementById('btnTimeIn').addEventListener('click', handleTimeIn);
  document.getElementById('authSignUp').addEventListener('click', () => switchAuthTab('signup'));
  document.getElementById('authLogIn').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('authGoToSignup').addEventListener('click', () => switchAuthTab('signup'));

  document.getElementById('idInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleTimeIn();
  });

  document.getElementById('link-signup').addEventListener('click', () => switchTab('signup'));
  document.getElementById('regCreate').addEventListener('click', handleSignUp);
  document.getElementById('btnCancelSignup').addEventListener('click', () => switchTab('timein'));

  document.getElementById('filterReason').addEventListener('change', loadLiveLogs);
  document.getElementById('filterDept').addEventListener('change', loadLiveLogs);
  document.getElementById('filterType').addEventListener('change', loadLiveLogs);

  document.getElementById('btnBulkDelete').addEventListener('click', deleteSelectedLogs);
  document.getElementById('btnClearLogs').addEventListener('click', clearLogs);
  document.getElementById('selectAll').addEventListener('change', e => toggleSelectAll(e.target));
}

window.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  switchTab('timein');
  switchAuthTab('login');
});
