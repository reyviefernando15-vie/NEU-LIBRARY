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

// Login & Authentication
function handleLogin(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentId').value;

    if (!studentId) {
        alert('Please enter ID Number');
        return;
    }

    // Check if student is registered
    database.ref('registrations').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                // Student is registered - allow login with just student ID
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
                alert('ID not found. Please register first using Google Sign-In.');
            }
        })
        .catch((error) => {
            alert('Login error: ' + error.message);
        });
}

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

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Store Google user info temporarily
            sessionStorage.setItem('googleUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            }));
            // Show registration modal
            document.getElementById('registrationModal').style.display = 'block';
        })
        .catch((error) => {
            alert('Google login failed: ' + error.message);
        });
}

function handleRegistration(event) {
    event.preventDefault();
    
    const regStudentId = document.getElementById('regStudentId').value;
    const regFullName = document.getElementById('regFullName').value;
    const regUserType = document.getElementById('regUserType').value;
    const regCollege = document.getElementById('regCollege').value;
    const regYearLevel = document.getElementById('regYearLevel').value;
    const regCourse = document.getElementById('regCourse').value;
    
    // Get Google user from session
    const googleUser = JSON.parse(sessionStorage.getItem('googleUser'));
    
    if (regStudentId && regFullName && regUserType && regCollege) {
        // Save registration to Realtime Database
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
        
        // Save to database
        database.ref('registrations/' + googleUser.uid).set(registrationData)
            .then(() => {
                // Store user in localStorage
                localStorage.setItem('user', JSON.stringify({
                    id: regStudentId,
                    uid: googleUser.uid,
                    email: googleUser.email,
                    name: regFullName,
                    role: regUserType
                }));
                
                // Clear session data
                sessionStorage.removeItem('googleUser');
                
                // Close modal and redirect
                document.getElementById('registrationModal').style.display = 'none';
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                alert('Registration failed: ' + error.message);
            });
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
        }).catch((error) => {
            console.log("Logout error:", error);
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// Modal Functions
function openModal(modalName) {
    const modalId = modalName.charAt(0).toUpperCase() + modalName.slice(1);
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalName) {
    const modalId = modalName.charAt(0).toUpperCase() + modalName.slice(1);
    const modal = document.getElementById(modalId + 'Modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Navigation
function navigateTo(page) {
    switch(page) {
        case 'visitor-stats':
            window.location.href = 'visitor-stats.html';
            break;
        case 'reports':
            window.location.href = 'reports.html';
            break;
        case 'user-management':
            window.location.href = 'user-management.html';
            break;
        case 'qr-scanner':
            window.location.href = 'qr-scanner.html';
            break;
        case 'book-catalog':
            window.location.href = 'book-catalog.html';
            break;
        default:
            console.log('Unknown page:', page);
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', appContainer.classList.contains('dark-mode'));
    }
}

// Apply dark mode on load
document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.classList.add('dark-mode');
        }
    }

    // Check authentication
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage !== 'index.html' && !user) {
        window.location.href = 'index.html';
    }
});

// Toggle Sidebar
function toggleSidebar() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    const sidebarFooter = document.querySelector('.sidebar-footer');
    
    if (sidebarNav) {
        sidebarNav.classList.toggle('active');
    }
    if (sidebarFooter) {
        sidebarFooter.classList.toggle('active');
    }
}

// QR Scanner Functions
function handleManualEntry(event) {
    if (event.key === 'Enter') {
        processStudentId();
    }
}

function processStudentId() {
    const studentId = document.getElementById('studentIdInput').value;
    
    if (studentId) {
        console.log('Processing Student ID:', studentId);
        
        // Simulate check-in
        const scansList = document.querySelector('.scans-list');
        if (scansList) {
            const newScan = document.createElement('div');
            newScan.className = 'scan-item';
            newScan.innerHTML = `
                <div class="scan-info">
                    <p class="scan-time">Now</p>
                    <p class="scan-name">STUDENT NAME</p>
                    <p class="scan-id">${studentId}</p>
                </div>
                <span class="scan-status success">✓ Checked In</span>
            `;
            scansList.insertBefore(newScan, scansList.firstChild);
        }
        
        document.getElementById('studentIdInput').value = '';
        alert('Student checked in successfully!');
    } else {
        alert('Please enter a student ID');
    }
}

// Tab Switching for User Management
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchBoxes = document.querySelectorAll('.search-box input');
    
    searchBoxes.forEach(searchBox => {
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.content-controls')?.nextElementSibling?.querySelector('table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }
        });
    });
});

// Export CSV functionality
function exportToCSV() {
    const table = document.querySelector('table');
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        let csvRow = [];
        cols.forEach(col => {
            csvRow.push('"' + col.textContent.trim().replace(/"/g, '""') + '"');
        });
        csv.push(csvRow.join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export_' + new Date().getTime() + '.csv';
    a.click();
}

// Print functionality
function printPage() {
    window.print();
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateStudentId(id) {
    const re = /^\d{2}-\d{5}-\d{3}$/;
    return re.test(id);
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Notification system
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
        animation: slideIn 0.3s ease-in;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
