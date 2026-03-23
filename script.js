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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// --- AUTHENTICATION FUNCTIONS ---

// 1. LOGIN WITH STUDENT ID ONLY
function handleLogin(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentId').value;

    if (!studentId) {
        showNotification('Please enter ID Number', 'error');
        return;
    }

    // Check if student is registered sa Realtime Database
    database.ref('registrations').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const registrations = snapshot.val();
                const regKey = Object.keys(registrations)[0];
                const regData = registrations[regKey];
                
                // I-save sa LocalStorage para manatiling logged in
                localStorage.setItem('user', JSON.stringify({
                    id: studentId,
                    uid: regKey,
                    email: regData.email,
                    name: regData.fullName,
                    role: regData.userType
                }));
                
                window.location.href = 'dashboard.html';
            } else {
                showNotification('ID not found. Please register first using Google Sign-In.', 'error');
            }
        })
        .catch((error) => {
            showNotification('Login error: ' + error.message, 'error');
        });
}

// 2. CONTINUE WITH GOOGLE (Para sa Registration)
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            
            // Check muna kung registered na ang Google account na ito
            database.ref('registrations/' + user.uid).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    // Kung registered na, login agad
                    const regData = snapshot.val();
                    localStorage.setItem('user', JSON.stringify({
                        id: regData.studentId,
                        uid: user.uid,
                        email: user.email,
                        name: regData.fullName,
                        role: regData.userType
                    }));
                    window.location.href = 'dashboard.html';
                } else {
                    // Kung bago, itago muna ang info at ipakita ang registration modal
                    sessionStorage.setItem('googleUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    }));
                    
                    // I-auto fill ang email/pangalan kung gusto (optional)
                    if(document.getElementById('regEmail')) document.getElementById('regEmail').value = user.email;
                    if(document.getElementById('regFullName')) document.getElementById('regFullName').value = user.displayName;
                    
                    document.getElementById('registrationModal').style.display = 'block';
                }
            });
        })
        .catch((error) => {
            showNotification('Google login failed: ' + error.message, 'error');
        });
}

// 3. HANDLE CREATE ACCOUNT FORM
function handleRegistration(event) {
    event.preventDefault();
    
    const regStudentId = document.getElementById('regStudentId').value;
    const regFullName = document.getElementById('regFullName').value;
    const regUserType = document.getElementById('regUserType').value;
    const regCollege = document.getElementById('regCollege').value;
    const regYearLevel = document.getElementById('regYearLevel').value;
    const regCourse = document.getElementById('regCourse').value;
    
    const googleUser = JSON.parse(sessionStorage.getItem('googleUser'));
    
    if (!googleUser) {
        showNotification("Please sign in with Google first.", "error");
        return;
    }

    if (regStudentId && regFullName && regUserType && regCollege) {
        const registrationData = {
            studentId: regStudentId,
            fullName: regFullName,
            email: googleUser.email,
            userType: regUserType,
            college: regCollege,
            yearLevel: regYearLevel,
            course: regCourse,
            createdAt: new Date().toISOString()
        };
        
        // I-save sa Firebase
        database.ref('registrations/' + googleUser.uid).set(registrationData)
            .then(() => {
                localStorage.setItem('user', JSON.stringify({
                    id: regStudentId,
                    uid: googleUser.uid,
                    email: googleUser.email,
                    name: regFullName,
                    role: regUserType
                }));
                
                sessionStorage.removeItem('googleUser');
                showNotification("Account Created Successfully!", "success");
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            })
            .catch((error) => {
                showNotification('Registration failed: ' + error.message, 'error');
            });
    } else {
        showNotification("Please fill in all required fields.", "error");
    }
}

// --- UTILITY & UI FUNCTIONS ---

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.toggle-password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

function closeRegistration() {
    document.getElementById('registrationModal').style.display = 'none';
    sessionStorage.removeItem('googleUser');
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut().then(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// Navigation Helper
function navigateTo(page) {
    window.location.href = page + '.html';
}

// Dark Mode Toggle
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
}

// App Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Check Login State
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage !== 'index.html' && !user) {
        window.location.href = 'index.html';
    }

    // Bind Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const regForm = document.getElementById('registrationForm');
    if (regForm) regForm.addEventListener('submit', handleRegistration);
});

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 9999;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
