// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB0xwF6fFbPD_zD6458t_19VWMwocQiV3I",
    authDomain: "sfdasdafd.firebaseapp.com",
    databaseURL: "https://sfdasdafd-default-rtdb.firebaseio.com",
    projectId: "sfdasdafd",
    storageBucket: "sfdasdafd.firebasestorage.app",
    messagingSenderId: "701386389930",
    appId: "1:701386389930:web:d1d08e0f520dd7770993d3"
};

// Initialize Firebase (Check if already initialized to avoid errors)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// --- 1. AUTHENTICATION LOGIC ---

// Login gamit ang Student ID (Para sa mga registered na)
function handleLogin(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentId').value;

    if (!studentId) {
        alert('Please enter ID Number');
        return;
    }

    // Check sa database kung existing ang Student ID
    database.ref('registrations').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const registrations = snapshot.val();
                const regKey = Object.keys(registrations)[0];
                const regData = registrations[regKey];
                
                localStorage.setItem('user', JSON.stringify({
                    id: studentId,
                    uid: regKey,
                    email: regData.email,
                    name: regData.fullName,
                    role: regData.userType
                }));
                window.location.href = 'dashboard.html';
            } else {
                alert('ID not found. Please register first using "Create Account" or Google Sign-In.');
            }
        })
        .catch((error) => alert('Login error: ' + error.message));
}

// Google Login & Registration Trigger
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    // Force select account para iwas auto-login errors
    provider.setCustomParameters({ prompt: 'select_account' });

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            
            // Check kung registered na ang UID na ito
            database.ref('registrations/' + user.uid).once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        // KUNG REGISTERED NA: Login agad
                        const data = snapshot.val();
                        localStorage.setItem('user', JSON.stringify({
                            id: data.studentId,
                            uid: user.uid,
                            email: user.email,
                            name: data.fullName,
                            role: data.userType
                        }));
                        window.location.href = 'dashboard.html';
                    } else {
                        // KUNG HINDI PA: Buksan ang Registration Modal
                        sessionStorage.setItem('googleUser', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        }));
                        
                        // Autofill sa modal
                        if(document.getElementById('regFullName')) {
                            document.getElementById('regFullName').value = user.displayName;
                        }
                        document.getElementById('registrationModal').style.display = 'block';
                    }
                });
        })
        .catch((error) => alert('Google login failed: ' + error.message));
}

// Handle Registration Form Submission
function handleRegistration(event) {
    event.preventDefault();
    
    const googleUser = JSON.parse(sessionStorage.getItem('googleUser'));
    if (!googleUser) {
        alert("Please sign in with Google first.");
        return;
    }

    const registrationData = {
        studentId: document.getElementById('regStudentId').value,
        fullName: document.getElementById('regFullName').value,
        email: googleUser.email,
        userType: document.getElementById('regUserType').value,
        college: document.getElementById('regCollege').value,
        yearLevel: document.getElementById('regYearLevel').value,
        course: document.getElementById('regCourse').value,
        createdAt: new Date().toISOString()
    };

    // Save sa Firebase Realtime Database gamit ang Google UID as Key
    database.ref('registrations/' + googleUser.uid).set(registrationData)
        .then(() => {
            localStorage.setItem('user', JSON.stringify({
                id: registrationData.studentId,
                uid: googleUser.uid,
                email: registrationData.email,
                name: registrationData.fullName,
                role: registrationData.userType
            }));
            
            sessionStorage.removeItem('googleUser');
            alert('Registration successful!');
            window.location.href = 'dashboard.html';
        })
        .catch((error) => alert('Registration failed: ' + error.message));
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut().then(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// --- 2. UI & NAVIGATION FUNCTIONS ---

function openRegistration() {
    // Recommendation: Always Google Login first for security
    loginWithGoogle();
}

function closeRegistration() {
    document.getElementById('registrationModal').style.display = 'none';
    sessionStorage.removeItem('googleUser');
}

function toggleSidebar() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) sidebarNav.classList.toggle('active');
}

function toggleDarkMode() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', appContainer.classList.contains('dark-mode'));
    }
}

// Navigation Helper
function navigateTo(page) {
    const routes = {
        'visitor-stats': 'visitor-stats.html',
        'reports': 'reports.html',
        'user-management': 'user-management.html',
        'qr-scanner': 'qr-scanner.html',
        'book-catalog': 'book-catalog.html'
    };
    if (routes[page]) window.location.href = routes[page];
}

// --- 3. SEARCH & TABLE LOGIC ---

document.addEventListener('DOMContentLoaded', function() {
    // Check Dark Mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.querySelector('.app-container')?.classList.add('dark-mode');
    }

    // Auth Protection
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'index.html' && !user) {
        window.location.href = 'index.html';
    }

    // Search Box Listener
    document.querySelectorAll('.search-box input').forEach(searchBox => {
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = document.querySelector('table');
            if (table) {
                table.querySelectorAll('tbody tr').forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
                });
            }
        });
    });

    // Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// QR Scanner Manual Entry
function handleManualEntry(event) {
    if (event.key === 'Enter') processStudentId();
}

function processStudentId() {
    const input = document.getElementById('studentIdInput');
    const id = input.value;
    if (id) {
        const list = document.querySelector('.scans-list');
        if (list) {
            const item = document.createElement('div');
            item.className = 'scan-item';
            item.innerHTML = `
                <div class="scan-info">
                    <p class="scan-time">Now</p>
                    <p class="scan-name">Validating...</p>
                    <p class="scan-id">${id}</p>
                </div>
                <span class="scan-status success">✓ Recorded</span>`;
            list.insertBefore(item, list.firstChild);
        }
        input.value = '';
        showNotification('Check-in recorded locally', 'success');
    }
}

// --- 4. UTILITIES (CSV, Print, Notifications) ---

function exportToCSV() {
    const table = document.querySelector('table');
    if (!table) return;
    let csv = [];
    table.querySelectorAll('tr').forEach(row => {
        let cols = [];
        row.querySelectorAll('td, th').forEach(col => cols.push('"' + col.textContent.trim() + '"'));
        csv.push(cols.join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_data_${Date.now()}.csv`;
    a.click();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : '#F44336'};
        color: white; border-radius: 4px; z-index: 9999;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function printPage() { window.print(); }
