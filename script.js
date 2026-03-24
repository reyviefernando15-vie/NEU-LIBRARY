// Same Config
const firebaseConfig = {
  apiKey: "AIzaSyDNzn1FoPhn-pU1t0_AEEusHsZmiZ8b5Tc",
  authDomain: "neulibrary-64dca.firebaseapp.com",
  databaseURL: "https://neulibrary-64dca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "neulibrary-64dca",
  storageBucket: "neulibrary-64dca.firebasestorage.app",
  messagingSenderId: "964459243201",
  appId: "1:964459243201:web:321f1e9aa0b73e6e0b5640",
  measurementId: "G-968RRPDHJC"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Auth Setup
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

function signInWithGoogle() {
  auth.signInWithPopup(googleProvider).then((result) => {
    const user = result.user;

    if (!user.email) {
      auth.signOut();
      return alert("Login Failed: No email address provided.");
    }

    // Explicitly check for master admin emails to grant admin dashboard bypasses on registration
    const isAdmin = (user.email === 'reyvie.fernando@neu.edu.ph' || user.email === 'jcesperanza@neu.edu.ph');

    // Check DB for existing account
    db.ref('users').orderByChild('email').equalTo(user.email).once('value', snap => {
      if (snap.exists()) {
        let dbUser = null;
        snap.forEach(child => { dbUser = child.val(); });

        if (dbUser.is_admin || isAdmin) {
          document.getElementById('admin-prof-name').innerText = dbUser.name || "LIBRARY ADMIN";
          document.getElementById('admin-prof-id').innerText = dbUser.id || "01-2345-678";
          enterApp('Admin');
        } else {
          alert("Account verified! You may now enter your ID Number to access the portal.");
          document.getElementById('login-email').value = dbUser.id;
          // Leaves user on the gateway to click 'Access Library Portal'
        }
      } else {
        // New user flow
        document.getElementById('reg-name').value = user.displayName || "";
        document.getElementById('reg-email').value = user.email || "";
        window.tempGooglePic = user.photoURL || "";
        toggleAuth('screen-register');
      }
    });

  }).catch((error) => {
    if (error.code !== 'auth/popup-closed-by-user') {
      console.error(error);
      alert("Error: " + error.message);
    }
  });
}

let tempUserData = null;
let html5QrCode;
let isCameraRunning = false;

function startCamera() {
  if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
  if (isCameraRunning) return;

  document.getElementById('camera-status').innerText = "Requesting Camera...";
  html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      if (isCameraRunning) {
        stopCamera();
        document.getElementById('portal-id-input').value = decodedText;
        processAttendance();
      }
    },
    (err) => { }).then(() => {
      isCameraRunning = true;
      document.getElementById('camera-status').innerText = "Scanning...";
      document.getElementById('camera-status').style.color = "#ffffff";
    }).catch((err) => {
      document.getElementById('camera-status').innerText = "Camera Denied";
      document.getElementById('camera-status').style.color = "#ef4444";
    });
}

function stopCamera() {
  if (html5QrCode && isCameraRunning) {
    html5QrCode.stop().then(() => {
      isCameraRunning = false;
    }).catch(err => console.log(err));
  }
}

function updateClock() { document.getElementById('nav-clock').innerText = new Date().toLocaleTimeString(); }
setInterval(updateClock, 1000);

function toggleAuth(id) {
  document.getElementById('screen-signin').style.display = 'none';
  document.getElementById('screen-register').style.display = 'none';
  document.getElementById(id).style.display = 'flex';
}

function updateCourses() {
  // Intentionally left blank as user requested simple text input for course.
}

// --- 1. REGISTRATION LOGIC ---
function handleRegister() {
  const id = document.getElementById('reg-id').value.trim();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value || window.tempGoogleEmail || "no-google-email@neu.edu.ph";
  const role = document.getElementById('reg-role').value;
  const college = document.getElementById('reg-college').value;
  const course = document.getElementById('reg-course').value;
  const year = document.getElementById('reg-year').value;
  const photoInput = document.getElementById('reg-photo');

  // Format Enforcement
  const idRegex = /^\d{2}-\d{5}-\d{3}$/;
  if (!idRegex.test(id) && role === 'Student') {
    alert("Invalid Student ID Format! Please use the format: 24-XXXXX-XXX");
    return;
  }

  if (!id || !name || !college || !course || !year) {
    alert("Fill all required fields!");
    return;
  }

  const saveBtn = document.querySelector('#screen-register .btn-green');
  if (saveBtn) saveBtn.innerText = "CREATING ACCOUNT...";

  const finalizeSave = (finalPic) => {
    const isAdminEmail = (email === 'reyvie.fernando@neu.edu.ph' || email === 'jcesperanza@neu.edu.ph');

    const userData = {
      id: id,
      name: name,
      email: email,
      role: role,
      college: college,
      course: course,
      year_level: year,
      profile_pic: finalPic,
      is_admin: isAdminEmail
    };

    // Proceed immediately to skip offline freezing
    db.ref('users/' + id.replace(/\./g, '_')).set(userData).catch(() => { });

    setTimeout(() => {
      if (saveBtn) saveBtn.innerText = "CREATE ACCOUNT";

      document.getElementById('reg-id').value = '';
      document.getElementById('reg-name').value = '';
      if (document.getElementById('reg-email')) document.getElementById('reg-email').value = '';
      document.getElementById('reg-course').value = '';
      if (photoInput) photoInput.value = '';

      if (isAdminEmail) {
        alert("Registration Successful! Welcome Admin.");
        document.getElementById('admin-prof-name').innerText = name || "LIBRARY ADMIN";
        document.getElementById('admin-prof-id').innerText = id || "01-2345-678";
        enterApp('Admin');
      } else {
        alert("Registration Successful! You can now Time-In on the Identity Gateway.");
        toggleAuth('screen-signin');
        document.getElementById('login-email').value = id;
      }
    }, 700);
  };

  if (photoInput && photoInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function (e) {
      finalizeSave(e.target.result);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    finalizeSave(window.tempGooglePic || "");
  }
}

function handleLogin() {
  if (typeof isScannerRunning !== 'undefined' && isScannerRunning) closeQRScanner();

  const inputVal = document.getElementById('login-email').value.trim();
  const reasonBox = document.getElementById('portal-reason-dropdown');
  const reason = reasonBox ? reasonBox.value : "Study / Reading";

  if (!inputVal) return alert("Please enter your ID Number!");

  // Master admin bypass (just in case)
  if (inputVal === 'reyvie.fernando@neu.edu.ph' || inputVal === 'jcesperanza@neu.edu.ph') {
    document.getElementById('admin-prof-name').innerText = "MASTER KEY";
    document.getElementById('dash-howdy-name').innerText = "ADMIN";
    document.getElementById('admin-prof-id').innerText = inputVal;
    return enterApp('Admin');
  }

  db.ref('users').orderByChild('id').equalTo(inputVal).once('value', snap => {
    if (snap.exists()) {
      let userMatch = null;
      snap.forEach(child => { userMatch = child.val(); });

      if (userMatch.is_admin) {
        document.getElementById('admin-prof-name').innerText = userMatch.name || "LIBRARY ADMIN";
        document.getElementById('dash-howdy-name').innerText = (userMatch.name || "ADMIN").split(" ")[0];
        document.getElementById('admin-prof-id').innerText = userMatch.id || "01-2345-678";
        enterApp('Admin');
      } else {
        // Unification: Regular user triggers attendance logic dynamically on the sign-in screen
        const now = new Date();
        const logData = {
          id: userMatch.id,
          name: userMatch.name,
          college: userMatch.college || "N/A",
          year_level: userMatch.year_level || "N/A",
          course: userMatch.course || "N/A",
          role: userMatch.role,
          reason: reason,
          profile_pic: userMatch.profile_pic || "",
          timestamp: now.toLocaleString(),
          rawDate: now.toISOString()
        };

        db.ref('attendance_logs').push(logData).catch(() => { });

        // Show Profile Card Live
        const mockProfile = userMatch.profile_pic || ("https://ui-avatars.com/api/?name=" + encodeURIComponent(userMatch.name || 'User') + "&background=random");
        document.getElementById('portal-user-pic').src = mockProfile;
        document.getElementById('portal-user-name').innerText = userMatch.name;
        document.getElementById('portal-user-course').innerText = userMatch.college ? (userMatch.college + (userMatch.course ? (' - ' + userMatch.course) : '')) : "Staff/Member";
        document.getElementById('portal-user-year').innerText = userMatch.year_level || "-";

        document.getElementById('portal-last-date').innerText = new Date().toLocaleDateString('en-US');
        document.getElementById('portal-last-time').innerText = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        document.getElementById('portal-profile-card').style.display = 'block';
        document.getElementById('login-email').value = '';

        setTimeout(() => { document.getElementById('login-email').focus(); }, 100);

        // Auto-hide Profile Card after 2 seconds for cleaner flow
        clearTimeout(window.profileTimeout);
        window.profileTimeout = setTimeout(() => {
          document.getElementById('portal-profile-card').style.display = 'none';
        }, 2000);
      }
    } else {
      alert("ID not recognized! If you are a new member, click 'Continue with Google'.");
    }
  });
}

function enterApp(mode) {
  document.getElementById('screen-signin').style.display = 'none';
  document.getElementById('screen-register').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  if (mode === 'Admin') {
    switchPage('dashboard');
    document.querySelector('.sidebar').style.display = 'block';
    document.querySelector('.main-content').style.marginLeft = '260px';
    document.getElementById('nav-dash').style.display = 'block';
    document.getElementById('nav-users').style.display = 'block';
    syncDashboardViews();
    syncLiveAttendance();
    syncUsers();
  }
}

function closeSuccessModal() {
  document.getElementById('modal-success').style.display = 'none';
}

// --- 3. DASHBOARD FLOW (Filtering Magic) ---
function syncUsers() {
  db.ref('users').on('value', snap => {
    let html = "";
    let dashboardHtml = "";
    let uTotal = 0, uStudent = 0, uStaff = 0;

    let usersArr = [];
    snap.forEach(child => usersArr.push(child.val()));
    usersArr.reverse();

    usersArr.forEach(user => {
      uTotal++;
      if (user.role === 'Student') uStudent++; else uStaff++;

      const accessBadge = (user.is_admin || user.email === 'reyvie.fernando@neu.edu.ph' || user.email === 'jcesperanza@neu.edu.ph')
        ? '<span class="badge" style="background:#1a1a1a;color:white;">ADMIN</span>'
        : '<span class="badge">USER</span>';
      html += `<tr>
        <td>${user.id}</td>
        <td><b>${user.name}</b></td>
        <td>${user.email}</td>
        <td>${user.college}</td>
        <td><span class="badge">${user.role}</span></td>
        <td>${accessBadge}</td>
        <td style="display:flex; gap: 5px;">
          <button class="btn-ghost" style="padding: 5px; margin-top: 0; background: ${user.is_admin ? '#f59e0b' : '#3b82f6'}; width: auto;" onclick="toggleAdmin('${user.id}', '${user.email}', ${user.is_admin || false})">${user.is_admin ? 'Revoke Admin' : 'Make Admin'}</button>
          <button class="btn-ghost" style="padding: 5px; margin-top: 0; background: #ef4444; width: auto;" onclick="deleteUser('${user.id}', '${user.email}', ${user.is_admin || false})">Delete</button>
        </td>
      </tr>`;

      if (uTotal <= 5) {
        dashboardHtml += `<tr>
            <td style="font-family: monospace; font-size: 0.9rem;">${user.id}</td>
            <td style="font-weight: 600; color: #1e293b;">${user.name}</td>
            <td style="color: #475569; font-size: 0.85rem;">${user.role}</td>
            <td style="color: #475569; font-size: 0.85rem;">${user.year_level || '-'}</td>
         </tr>`;
      }
    });
    document.getElementById('user-list-body').innerHTML = html;
    if (document.getElementById('dash-reg-members')) {
      document.getElementById('dash-reg-members').innerHTML = dashboardHtml;
    }
    if (document.getElementById('dash-users-total')) {
      document.getElementById('dash-users-total').innerText = uTotal;
      document.getElementById('dash-users-students').innerText = uStudent;
      document.getElementById('dash-users-staff').innerText = uStaff;
    }
  });
}

function toggleAdmin(id, email, currentIsAdmin) {
  if (email === 'reyvie.fernando@neu.edu.ph' || email === 'jcesperanza@neu.edu.ph') {
    alert("Action Denied: Master keys cannot be altered.");
    return;
  }
  if (confirm(`Are you sure you want to ${currentIsAdmin ? 'revoke' : 'grant'} Admin privileges to this user?`)) {
    db.ref('users/' + id.replace(/\./g, '_')).update({ is_admin: !currentIsAdmin });
  }
}

function deleteUser(id, email, isAdminLocal) {
  if (isAdminLocal || email === 'reyvie.fernando@neu.edu.ph' || email === 'jcesperanza@neu.edu.ph') {
    alert("Action Denied: You cannot delete an Administrator account.");
    return;
  }
  if (confirm("Are you sure you want to delete this user?")) {
    db.ref('users/' + id.replace(/\./g, '_')).remove();
  }
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split('\n');
    let successCount = 0;

    // Expected CSV format: ID, Name, Email, College, Role
    // Skipping header (row 0)
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 5) {
        const id = cols[0].trim();
        const name = cols[1].trim();
        const email = cols[2].trim();
        const college = cols[3].trim();
        const role = cols[4].trim();

        if (id && email) {
          db.ref('users/' + id.replace(/\./g, '_')).set({
            id: id,
            name: name,
            email: email,
            college: college,
            role: role,
            is_admin: false
          });
          successCount++;
        }
      }
    }
    alert("Batch Upload Complete! " + successCount + " users added.");
    event.target.value = ""; // reset input
  };
  reader.readAsText(file);
}

let collegeChartInst = null;
let actionChartInst = null;
let dashWeeklyChartInst = null;

function renderCharts(collegeData, actionData) {
  const ctxCol = document.getElementById('collegeChart');
  const ctxAct = document.getElementById('actionChart');
  if (!ctxCol || !ctxAct) return;

  if (collegeChartInst) collegeChartInst.destroy();
  if (actionChartInst) actionChartInst.destroy();

  collegeChartInst = new Chart(ctxCol, {
    type: 'bar',
    data: {
      labels: Object.keys(collegeData),
      datasets: [{
        label: 'Total Visits',
        data: Object.values(collegeData),
        backgroundColor: '#1e3a8a',
        borderRadius: 4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  actionChartInst = new Chart(ctxAct, {
    type: 'doughnut',
    data: {
      labels: Object.keys(actionData),
      datasets: [{
        data: Object.values(actionData),
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'],
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function syncDashboardViews() {
  db.ref('attendance_logs').on('value', snap => {
    const reasonEl = document.getElementById('dash-filter-reason');
    const rFilter = reasonEl ? reasonEl.value : 'All';
    const colEl = document.getElementById('dash-filter-college');
    const cFilter = colEl ? colEl.value : 'All';
    const typeEl = document.getElementById('dash-filter-type');
    const tFilter = typeEl ? typeEl.value : 'All';

    let recentUsersHtml = "";
    let filterCount = 0;

    let daysData = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };

    let logsArr = [];
    snap.forEach(child => logsArr.push(child.val()));
    logsArr.reverse();

    logsArr.forEach(log => {
      let passR = (rFilter === 'All' || log.reason === rFilter);
      let passC = (cFilter === 'All' || log.college === cFilter);
      let passT = (tFilter === 'All' || log.role === tFilter);

      if (passR && passC && passT) {
        filterCount++;

        if (log.rawDate) {
          const d = new Date(log.rawDate);
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          daysData[dayNames[d.getDay()]]++;
        }

        if (filterCount <= 15) {
          let fTime = "Unknown Time";
          try {
            if (log.rawDate) {
              fTime = new Date(log.rawDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (log.timestamp) {
              fTime = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (e) { }

          const mockProfile = log.profile_pic || ("https://ui-avatars.com/api/?name=" + encodeURIComponent(log.name || 'User') + "&background=random");
          recentUsersHtml += `<div class="activity-item">
                <input type="checkbox" style="margin-top: 5px;">
                <div class="activity-avatar"><img src="${mockProfile}"></div>
                <div class="activity-info">
                  <div class="activity-name">${log.name || 'Unknown User'}</div>
                  <div class="activity-details">${log.course || 'N/A'} | ${log.college || 'N/A'}</div>
                </div>
                <div class="activity-time">${fTime}</div>
             </div>`;
        }
      }
    });

    if (document.getElementById('dash-display-count')) {
      document.getElementById('dash-display-count').innerText = filterCount;
    }
    if (document.getElementById('dash-recent-users')) {
      document.getElementById('dash-recent-users').innerHTML = recentUsersHtml;
    }

    const ctxDash = document.getElementById('dashWeeklyChart');
    if (!ctxDash) return;
    if (dashWeeklyChartInst) dashWeeklyChartInst.destroy();

    dashWeeklyChartInst = new Chart(ctxDash, {
      type: 'line',
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: 'Visitors',
          data: [daysData["Mon"], daysData["Tue"], daysData["Wed"], daysData["Thu"], daysData["Fri"], daysData["Sat"], daysData["Sun"]],
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          borderColor: '#16a34a',
          borderWidth: 3,
          tension: 0.1,
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#16a34a',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
  });
}

function clearRecentUsers() {
  if (document.getElementById('dash-recent-users')) {
    document.getElementById('dash-recent-users').innerHTML = '<div style="text-align:center; color:#94a3b8; padding: 20px;">Cleared</div>';
  }
}

function syncLiveAttendance() {
  db.ref('attendance_logs').on('value', snap => {
    const srchEl = document.getElementById('log-search');
    const searchTerm = srchEl ? srchEl.value.toLowerCase() : '';
    const actEl = document.getElementById('log-filter-action');
    const actionFilter = actEl ? actEl.value : 'All';
    const dteEl = document.getElementById('log-filter-date');
    const dateFilterRaw = dteEl ? dteEl.value : ''; // YYYY-MM-DD
    const colEl = document.getElementById('log-filter-college');
    const collegeFilter = colEl ? colEl.value : 'All';
    const yearEl = document.getElementById('log-filter-year');
    const yearFilter = yearEl ? yearEl.value : 'All';

    let html = "";
    let todayCount = 0;
    const todayStr = new Date().toISOString().substring(0, 10);

    let colData = { "SEA": 0, "CAS": 0, "CBA": 0, "CICS": 0, "CED": 0 };
    let actData = { "Study / Reading": 0, "Research": 0, "Borrow / Return Books": 0, "Computer Use": 0 };

    snap.forEach(child => {
      const log = child.val();

      if (log.rawDate && log.rawDate.startsWith(todayStr)) {
        todayCount++;
      }

      let passSearch = true;
      if (searchTerm) {
        const searchable = (log.id + " " + log.name + " " + log.reason).toLowerCase();
        if (!searchable.includes(searchTerm)) passSearch = false;
      }

      let passAction = (actionFilter === 'All' || log.reason === actionFilter);
      let passDate = (!dateFilterRaw || (log.rawDate && log.rawDate.startsWith(dateFilterRaw)));
      let passCollege = (collegeFilter === 'All' || log.college === collegeFilter);
      let passYear = (yearFilter === 'All' || log.year_level === yearFilter);

      if (passSearch && passDate) { // Action filter shouldn't strictly block chart data rendering across the board
        const col = log.college || "Unknown";
        if (colData[col] !== undefined) colData[col]++; else colData[col] = 1;

        const rsn = log.reason || "Unknown";
        if (actData[rsn] !== undefined) actData[rsn]++; else actData[rsn] = 1;
      }

      if (passSearch && passAction && passDate && passCollege && passYear) {
        const statusBadge = `<span style="background: #e0e7ff; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">Success</span>`;

        let formattedTime = "Unknown Time";
        try {
          if (log.rawDate) {
            formattedTime = new Date(log.rawDate).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
          } else if (log.timestamp) {
            formattedTime = new Date(log.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
          }
        } catch (e) { }

        html = `<tr>
        <td style="color: #64748b; font-size: 0.8rem;">${formattedTime}</td>
        <td style="font-family: monospace; font-size: 0.9rem;">${log.id}</td>
        <td style="font-weight: 600;">${log.name}</td>
        <td style="color: #475569; font-weight: 600;">${log.college || '-'} | ${log.year_level || '-'}</td>
        <td style="font-size: 0.85rem; color: #475569;">${log.reason}</td>
        <td>${statusBadge}</td>
      </tr>` + html;
      }
    });

    document.getElementById('attendance-logs-body').innerHTML = html;
    if (document.getElementById('dash-lib-now')) {
      document.getElementById('dash-lib-now').innerText = todayCount;
    }
    renderCharts(colData, actData);
  });
}

function switchPage(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  try {
    if (typeof event !== 'undefined' && event && event.currentTarget && event.currentTarget.classList) {
      event.currentTarget.classList.add('active');
    }
  } catch (e) { }
}

// PRO-TIP: EXPORT BUTTON
function exportToCSV() {
  let csv = "Timestamp,ID,Name,Demographics,Reason,Status\n";
  const rows = document.querySelectorAll("#attendance-logs-body tr");
  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    let rowData = [];
    cols.forEach(col => {
      let text = col.innerText.replace(/"/g, '""');
      rowData.push(`"${text}"`);
    });
    csv += rowData.join(",") + "\n";
  });
  triggerCSVDownload(csv, 'Library_Attendance_Logs.csv');
}

// Export Dashboard Logs
function exportDashboardLogsCSV() {
  db.ref('attendance_logs').once('value').then(snap => {
    let csv = "Timestamp,ID,Name,College,Year,Reason,Role\n";
    let logsArr = [];
    snap.forEach(child => logsArr.push(child.val()));
    logsArr.reverse(); // Newest first

    logsArr.forEach(log => {
      csv += `"${log.timestamp || log.rawDate}","${log.id}","${log.name || ''}","${log.college || ''}","${log.year_level || ''}","${log.reason || ''}","${log.role || ''}"\n`;
    });
    triggerCSVDownload(csv, 'Dashboard_Recent_Logs.csv');
  });
}

// Export Users CSV
function exportUsersCSV() {
  db.ref('users').once('value').then(snap => {
    let csv = "ID,Name,Email,College,Course,Year Level,Role,Is Admin\n";
    snap.forEach(child => {
      const user = child.val();
      csv += `"${user.id}","${user.name || ''}","${user.email || ''}","${user.college || ''}","${user.course || ''}","${user.year_level || ''}","${user.role || ''}","${user.is_admin ? 'Yes' : 'No'}"\n`;
    });
    triggerCSVDownload(csv, 'Library_Users.csv');
  });
}

function triggerCSVDownload(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- QR SCANNER MODAL LOGIC ---
let html5QrcodeScanner = null;

function openQRScanner() {
  document.getElementById('qr-modal').style.display = 'flex';

  if (!html5QrcodeScanner) {
    html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  }
}

function closeQRScanner() {
  document.getElementById('qr-modal').style.display = 'none';
  if (html5QrcodeScanner) {
    // html5QrcodeScanner.clear() returns a Promise
    html5QrcodeScanner.clear().then(() => {
      html5QrcodeScanner = null;
    }).catch(e => {
      console.error(e);
      html5QrcodeScanner = null;
    });
  }
}

function onScanSuccess(decodedText) {
  closeQRScanner();

  if (document.getElementById('main-app').style.display === 'block') {
    // Attendance portal is open
    document.getElementById('portal-id-input').value = decodedText;
    processAttendance();
  } else {
    // Sign-in gateway is open
    document.getElementById('login-email').value = decodedText;
    handleLogin();
  }
}

function onScanFailure(error) {
  // quiet
}
