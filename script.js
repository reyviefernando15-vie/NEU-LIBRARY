/*
  NEU LIBRARY MANAGEMENT SYSTEM
  Complete JavaScript Implementation
  Author: System Admin
  Last Updated: March 2026
*/

// ============================================
// FIREBASE CONFIGURATION
// ============================================
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

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let currentAdminRole = null;
let qrScanner = null;
let collegeChart = null;
let peakHoursChart = null;
let visitorsData = [];
let booksData = [];
let studentsData = [];
let usersData = [];

// ============================================
// PAGE NAVIGATION & INITIALIZATION
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  checkAuthState();
  loadAllData();
});

function initializeEventListeners() {
  // Attendance Portal
  document.getElementById('btnManualInput')?.addEventListener('click', () => switchInputMethod('manual'));
  document.getElementById('btnQRScan')?.addEventListener('click', () => switchInputMethod('qr'));
  document.getElementById('btnTimeIn')?.addEventListener('click', handleTimeIn);
  document.getElementById('btnStartScan')?.addEventListener('click', startQRScan);
  document.getElementById('btnStopScan')?.addEventListener('click', stopQRScan);

  // Navigation
  document.getElementById('link-attendance')?.addEventListener('click', () => navigateTo('attendance'));
  document.getElementById('link-dashboard')?.addEventListener('click', () => navigateTo('dashboard'));
  document.getElementById('link-logger')?.addEventListener('click', () => navigateTo('logger'));
  document.getElementById('link-books')?.addEventListener('click', () => navigateTo('books'));
  document.getElementById('link-students')?.addEventListener('click', () => navigateTo('students'));
  document.getElementById('link-users')?.addEventListener('click', () => navigateTo('users'));
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
  document.getElementById('admin-login-btn')?.addEventListener('click', () => window.location.href = 'LogIn.html');

  // Dashboard
  document.getElementById('dashboardFilter')?.addEventListener('change', handleDashboardFilterChange);
  document.getElementById('btnApplyDateFilter')?.addEventListener('click', applyDateFilter);

  // Logger
  document.getElementById('loggerSearch')?.addEventListener('input', searchLogger);
  document.getElementById('btnRefreshLogger')?.addEventListener('click', loadLogger);

  // Book Catalog
  document.getElementById('btnAddBook')?.addEventListener('click', openBookModal);
  document.getElementById('btnSaveBook')?.addEventListener('click', saveBook);
  document.getElementById('closeBookModal')?.addEventListener('click', closeBookModal);
  document.getElementById('bookSearch')?.addEventListener('input', searchBooks);

  // Student Records
  document.getElementById('btnAddStudent')?.addEventListener('click', openStudentModal);
  document.getElementById('btnSaveStudent')?.addEventListener('click', saveStudent);
  document.getElementById('closeStudentModal')?.addEventListener('click', closeStudentModal);
  document.getElementById('closeStudentHistoryModal')?.addEventListener('click', closeStudentHistoryModal);
  document.getElementById('studentSearch')?.addEventListener('input', searchStudents);

  // User Management
  document.getElementById('btnAddUser')?.addEventListener('click', openUserModal);
  document.getElementById('btnSaveUser')?.addEventListener('click', saveUser);
  document.getElementById('closeUserModal')?.addEventListener('click', closeUserModal);

  // Login Page
  if (document.getElementById('btnGoogleSignIn')) {
    document.getElementById('btnGoogleSignIn').addEventListener('click', signInWithGoogle);
    document.getElementById('btnContinueAsAdmin')?.addEventListener('click', continueAsAdmin);
    document.getElementById('btnChangeUser')?.addEventListener('click', changeUser);
    document.getElementById('btnGoogleSignOut')?.addEventListener('click', googleSignOut);
  }

  // Tab switching for Student History
  document.querySelectorAll('.tab-button')?.forEach(button => {
    button.addEventListener('click', switchTab);
  });

  // Role selection for permissions
  document.getElementById('userRole')?.addEventListener('change', updatePermissionsList);
}

function navigateTo(page) {
  // Check if user has permissions
  if (['dashboard', 'logger', 'books', 'students', 'users'].includes(page) && !currentAdminRole) {
    alert('Please log in as admin first');
    window.location.href = 'LogIn.html';
    return;
  }

  // Hide all sections
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.add('hidden');
  });

  // Show selected section
  const sectionId = page === 'attendance' ? 'section-attendance' : `section-${page}`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
  }

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  if (page === 'attendance') {
    document.getElementById('link-attendance')?.classList.add('active');
  } else {
    document.getElementById(`link-${page}`)?.classList.add('active');
  }

  // Load data for section
  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'logger') {
    loadLogger();
  } else if (page === 'books') {
    loadBooks();
  } else if (page === 'students') {
    loadStudents();
  } else if (page === 'users') {
    loadUsers();
  }
}

// ============================================
// AUTHENTICATION & LOGIN
// ============================================

function checkAuthState() {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (window.location.pathname.includes('LogIn.html')) {
      if (user) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('googleUserInfo').classList.remove('hidden');
        document.getElementById('googleUserName').textContent = user.displayName || user.email;
        document.getElementById('googleUserEmail').textContent = `(${user.email})`;
        document.getElementById('roleSelection').classList.remove('hidden');
      }
    } else if (user) {
      loadAdminRole();
    }
  });
}

function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ hd: 'neu.edu.ph' });
  
  auth.signInWithPopup(provider)
    .then(result => {
      currentUser = result.user;
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('googleUserInfo').classList.remove('hidden');
      document.getElementById('googleUserName').textContent = currentUser.displayName;
      document.getElementById('googleUserEmail').textContent = `(${currentUser.email})`;
      document.getElementById('roleSelection').classList.remove('hidden');
    })
    .catch(error => {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    });
}

function googleSignOut() {
  auth.signOut().then(() => {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('googleUserInfo').classList.add('hidden');
    document.getElementById('roleSelection').classList.add('hidden');
    currentUser = null;
    currentAdminRole = null;
  });
}

function continueAsAdmin() {
  const selectedRole = document.querySelector('input[name="role"]:checked');
  if (!selectedRole) {
    alert('Please select a role');
    return;
  }

  currentAdminRole = selectedRole.value;
  localStorage.setItem('adminRole', currentAdminRole);
  localStorage.setItem('adminUser', currentUser.uid);

  window.location.href = 'index.html';
}

function changeUser() {
  googleSignOut();
}

function loadAdminRole() {
  const savedRole = localStorage.getItem('adminRole');
  const savedUser = localStorage.getItem('adminUser');
  
  if (savedRole && savedUser && currentUser && currentUser.uid === savedUser) {
    currentAdminRole = savedRole;
    showAdminUI();
  } else {
    hideAdminUI();
  }
}

function showAdminUI() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.remove('hidden');
  });
  document.getElementById('admin-login-btn')?.classList.add('hidden');
}

function hideAdminUI() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.add('hidden');
  });
  document.getElementById('admin-login-btn')?.classList.remove('hidden');
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminUser');
    currentAdminRole = null;
    auth.signOut().then(() => {
      window.location.href = 'index.html';
    });
  }
}

// ============================================
// ATTENDANCE PORTAL - QR SCANNER
// ============================================

function switchInputMethod(method) {
  const manualSection = document.getElementById('manualInputSection');
  const qrSection = document.getElementById('qrScanSection');
  const manualBtn = document.getElementById('btnManualInput');
  const qrBtn = document.getElementById('btnQRScan');

  if (method === 'manual') {
    manualSection.classList.remove('hidden');
    qrSection.classList.add('hidden');
    manualBtn.classList.add('active');
    qrBtn.classList.remove('active');
    stopQRScan();
  } else {
    manualSection.classList.add('hidden');
    qrSection.classList.remove('hidden');
    manualBtn.classList.remove('active');
    qrBtn.classList.add('active');
    startQRScan();
  }
}

function initQRScanner() {
  qrScanner = new Html5QrcodeScanner("qr-reader", {
    fps: 10,
    qrbox: { width: 250, height: 250 }
  });

  qrScanner.render(onScanSuccess, onScanError);
}

function onScanSuccess(decodedText, decodedResult) {
  const scannedId = decodedText.trim();
  document.getElementById('idInput').value = scannedId;
  document.getElementById('qr-reader-results').innerHTML = `<p style="color: green; font-weight: bold;">✓ Scanned: ${scannedId}</p>`;
  
  switchInputMethod('manual');
  setTimeout(() => handleTimeIn(), 1000);
}

function onScanError(error) {
  console.warn(`QR scan error: ${error}`);
}

function startQRScan() {
  if (qrScanner) {
    qrScanner.clear();
  }
  initQRScanner();
  document.getElementById('btnStartScan').classList.add('hidden');
  document.getElementById('btnStopScan').classList.remove('hidden');
}

function stopQRScan() {
  if (qrScanner) {
    qrScanner.clear();
  }
  document.getElementById('btnStartScan').classList.remove('hidden');
  document.getElementById('btnStopScan').classList.add('hidden');
}

function handleTimeIn() {
  const studentId = document.getElementById('idInput').value.trim();
  const reason = document.getElementById('visitReason').value;

  if (!studentId) {
    alert('Please enter or scan a Student ID');
    return;
  }

  if (!reason) {
    alert('Please select a reason for visiting');
    return;
  }

  db.ref('students').orderByChild('studentID').equalTo(studentId).once('value', snapshot => {
    if (snapshot.exists()) {
      const student = Object.values(snapshot.val())[0];
      const timestamp = new Date();
      const logEntry = {
        studentID: studentId,
        studentName: student.studentName,
        college: student.college,
        reason: reason,
        timeIn: timestamp.toLocaleString(),
        timeInMs: timestamp.getTime(),
        status: 'Inside'
      };

      db.ref('visitorsLog').push(logEntry);
      displayStudentProfile(student, 'Time In Successful');
      
      setTimeout(() => {
        document.getElementById('idInput').value = '';
        document.getElementById('visitReason').value = '';
        document.getElementById('userProfile').classList.add('hidden');
        updateAttendanceStats();
      }, 3000);
    } else {
      alert('Student ID not found in database');
    }
  });
}

function displayStudentProfile(student, statusMsg) {
  document.getElementById('dispName').textContent = student.studentName;
  document.getElementById('dispID').textContent = `ID: ${student.studentID}`;
  document.getElementById('dispCollege').textContent = student.college;
  document.getElementById('statusMessage').textContent = `✅ ${statusMsg}`;
  document.getElementById('userProfile').classList.remove('hidden');
}

function updateAttendanceStats() {
  db.ref('visitorsLog').once('value', snapshot => {
    const logs = snapshot.val() || {};
    const today = new Date().toLocaleDateString();
    
    let totalToday = 0;
    let currentlyInside = 0;

    Object.values(logs).forEach(log => {
      if (log.timeIn && log.timeIn.includes(today)) {
        totalToday++;
        if (log.status === 'Inside') {
          currentlyInside++;
        }
      }
    });

    document.getElementById('totalVisitorsSmall').textContent = totalToday;
    document.getElementById('activeUsersSmall').textContent = currentlyInside;
  });
}

// ============================================
// DASHBOARD - ANALYTICS
// ============================================

function loadDashboard() {
  db.ref('visitorsLog').once('value', snapshot => {
    const logs = snapshot.val() || {};
    analyzeVisitorData(logs);
    loadChartsData(logs);
  });
}

function analyzeVisitorData(logs) {
  const today = new Date().toLocaleDateString();
  let totalVisitors = 0;
  let currentlyInside = 0;
  let totalDuration = 0;
  let validDurations = 0;
  const peakHours = {};

  Object.values(logs).forEach(log => {
    if (log.timeIn && log.timeIn.includes(today)) {
      totalVisitors++;

      if (!log.timeOut) {
        currentlyInside++;
      }

      if (log.timeOut) {
        const inTime = new Date(log.timeInMs);
        const outTime = new Date(log.timeOutMs);
        const duration = (outTime - inTime) / (1000 * 60);
        totalDuration += duration;
        validDurations++;
      }

      if (log.timeIn) {
        const hour = log.timeIn.split(':')[0];
        peakHours[hour] = (peakHours[hour] || 0) + 1;
      }
    }
  });

  const avgDuration = validDurations > 0 ? Math.round(totalDuration / validDurations) : 0;
  const peakHour = Object.entries(peakHours).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';

  document.getElementById('totalVisitors').textContent = totalVisitors;
  document.getElementById('activeUsers').textContent = currentlyInside;
  document.getElementById('avgStayDuration').textContent = avgDuration + 'm';
  document.getElementById('peakHour').textContent = peakHour + ':00';
}

function loadChartsData(logs) {
  const colleges = {};
  const hours = {};

  Object.values(logs).forEach(log => {
    if (log.college) {
      colleges[log.college] = (colleges[log.college] || 0) + 1;
    }
    if (log.timeIn) {
      const hour = log.timeIn.split(':')[0];
      hours[hour] = (hours[hour] || 0) + 1;
    }
  });

  drawCollegeChart(colleges);
  drawPeakHoursChart(hours);
}

function drawCollegeChart(data) {
  const ctx = document.getElementById('collegeChart').getContext('2d');
  if (collegeChart) collegeChart.destroy();

  collegeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [
          '#006400', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function drawPeakHoursChart(data) {
  const ctx = document.getElementById('peakHoursChart').getContext('2d');
  if (peakHoursChart) peakHoursChart.destroy();

  const sortedHours = Object.keys(data).sort().slice(0, 12);
  const values = sortedHours.map(h => data[h] || 0);

  peakHoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedHours.map(h => h + ':00'),
      datasets: [{
        label: 'Visitors',
        data: values,
        backgroundColor: '#006400',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function handleDashboardFilterChange() {
  const filter = document.getElementById('dashboardFilter').value;
  if (filter === 'custom') {
    document.getElementById('customDateRange').classList.remove('hidden');
  } else {
    document.getElementById('customDateRange').classList.add('hidden');
  }
}

function applyDateFilter() {
  alert('Date filtering will be implemented');
}

// ============================================
// LIBRARY LOGGER
// ============================================

function loadLogger() {
  db.ref('visitorsLog').orderByChild('timeInMs').limitToLast(50).once('value', snapshot => {
    const logs = snapshot.val() || {};
    const logArray = Object.entries(logs).map(([key, value]) => ({ id: key, ...value })).reverse();
    
    visitorsData = logArray;
    renderLoggerTable(logArray);
  });
}

function renderLoggerTable(logs) {
  const tbody = document.getElementById('loggerBody');
  tbody.innerHTML = '';

  logs.forEach(log => {
    const row = document.createElement('tr');
    const status = log.status || (log.timeOut ? 'Left' : 'Inside');
    const statusClass = status === 'Inside' ? 'status-inside' : 'status-left';

    row.innerHTML = `
      <td>${log.studentName}</td>
      <td>${log.studentID}</td>
      <td>${log.college}</td>
      <td>${log.reason}</td>
      <td>${log.timeIn}</td>
      <td>${log.timeOut || '--'}</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
      <td>
        ${status === 'Inside' ? `<button class="btn-small" onclick="handleTimeOut('${log.id}')">Time Out</button>` : '--'}
      </td>
    `;
    tbody.appendChild(row);
  });
}

function handleTimeOut(logId) {
  db.ref(`visitorsLog/${logId}`).update({
    timeOut: new Date().toLocaleString(),
    timeOutMs: new Date().getTime(),
    status: 'Left'
  }).then(() => {
    loadLogger();
  });
}

function searchLogger() {
  const query = document.getElementById('loggerSearch').value.toLowerCase();
  const filtered = visitorsData.filter(log =>
    log.studentName.toLowerCase().includes(query) ||
    log.studentID.toLowerCase().includes(query) ||
    log.college.toLowerCase().includes(query)
  );
  renderLoggerTable(filtered);
}

// ============================================
// BOOK CATALOG
// ============================================

function loadBooks() {
  db.ref('books').once('value', snapshot => {
    booksData = snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    renderBookGrid(booksData);
  });
}

function renderBookGrid(books) {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '';

  if (books.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No books added yet.</p>';
    return;
  }

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    const statusClass = book.status === 'Available' ? 'status-available' : 'status-borrowed';

    card.innerHTML = `
      <div class="book-card-header">
        <h3>${book.title}</h3>
        <span class="status-badge ${statusClass}">${book.status}</span>
      </div>
      <p class="book-author">By ${book.author}</p>
      <p class="book-isbn">ISBN: ${book.isbn}</p>
      <p class="book-category">${book.category}</p>
      <div class="book-actions">
        <button class="btn-small" onclick="editBook('${book.id}')">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteBook('${book.id}')">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openBookModal() {
  document.getElementById('bookModalTitle').textContent = 'Add New Book';
  document.getElementById('bookTitle').value = '';
  document.getElementById('bookAuthor').value = '';
  document.getElementById('bookISBN').value = '';
  document.getElementById('bookCategory').value = '';
  document.getElementById('bookPublisher').value = '';
  document.getElementById('bookYear').value = '';
  document.getElementById('bookStatus').value = 'Available';
  document.getElementById('btnDeleteBook').classList.add('hidden');
  document.getElementById('bookModal').classList.remove('hidden');
}

function closeBookModal() {
  document.getElementById('bookModal').classList.add('hidden');
}

function saveBook() {
  const data = {
    title: document.getElementById('bookTitle').value,
    author: document.getElementById('bookAuthor').value,
    isbn: document.getElementById('bookISBN').value,
    category: document.getElementById('bookCategory').value,
    publisher: document.getElementById('bookPublisher').value,
    year: document.getElementById('bookYear').value,
    status: document.getElementById('bookStatus').value,
    createdAt: new Date().toISOString()
  };

  if (!data.title || !data.author || !data.isbn) {
    alert('Please fill in all required fields');
    return;
  }

  const bookId = document.getElementById('bookTitle').dataset.bookId;
  if (bookId) {
    db.ref(`books/${bookId}`).update(data).then(() => {
      loadBooks();
      closeBookModal();
    });
  } else {
    db.ref('books').push(data).then(() => {
      loadBooks();
      closeBookModal();
    });
  }
}

function editBook(bookId) {
  const book = booksData.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('bookModalTitle').textContent = 'Edit Book';
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookISBN').value = book.isbn;
  document.getElementById('bookCategory').value = book.category;
  document.getElementById('bookPublisher').value = book.publisher;
  document.getElementById('bookYear').value = book.year;
  document.getElementById('bookStatus').value = book.status;
  document.getElementById('bookTitle').dataset.bookId = bookId;
  document.getElementById('btnDeleteBook').classList.remove('hidden');
  document.getElementById('bookModal').classList.remove('hidden');
}

function deleteBook(bookId) {
  if (currentAdminRole === 'super-admin') {
    if (confirm('Are you sure you want to delete this book?')) {
      db.ref(`books/${bookId}`).remove().then(() => {
        loadBooks();
      });
    }
  } else {
    alert('Only Super Admins can delete books');
  }
}

function searchBooks() {
  const query = document.getElementById('bookSearch').value.toLowerCase();
  const filtered = booksData.filter(book =>
    book.title.toLowerCase().includes(query) ||
    book.author.toLowerCase().includes(query) ||
    book.isbn.includes(query)
  );
  renderBookGrid(filtered);
}

// ============================================
// STUDENT RECORDS
// ============================================

function loadStudents() {
  db.ref('students').once('value', snapshot => {
    studentsData = snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    renderStudentGrid(studentsData);
  });
}

function renderStudentGrid(students) {
  const grid = document.getElementById('studentGrid');
  grid.innerHTML = '';

  if (students.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No students added yet.</p>';
    return;
  }

  students.forEach(student => {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <div class="student-card-header">
        <h3>${student.studentName}</h3>
        <p class="student-id">ID: ${student.studentID}</p>
      </div>
      <p class="student-college">${student.college}</p>
      <p class="student-course">${student.course || 'N/A'}</p>
      <div class="student-actions">
        <button class="btn-small" onclick="viewStudentHistory('${student.id}', '${student.studentName}')">History</button>
        <button class="btn-small" onclick="editStudent('${student.id}')">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openStudentModal() {
  document.getElementById('studentModalTitle').textContent = 'Add New Student';
  document.getElementById('studentID').value = '';
  document.getElementById('studentName').value = '';
  document.getElementById('studentEmail').value = '';
  document.getElementById('studentCollege').value = '';
  document.getElementById('studentYear').value = '';
  document.getElementById('studentCourse').value = '';
  document.getElementById('qrCodeDisplay').innerHTML = '';
  document.getElementById('btnDownloadQR').classList.add('hidden');
  document.getElementById('btnDeleteStudent').classList.add('hidden');
  document.getElementById('studentModal').classList.remove('hidden');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.add('hidden');
}

function saveStudent() {
  const data = {
    studentID: document.getElementById('studentID').value,
    studentName: document.getElementById('studentName').value,
    email: document.getElementById('studentEmail').value,
    college: document.getElementById('studentCollege').value,
    year: document.getElementById('studentYear').value,
    course: document.getElementById('studentCourse').value,
    createdAt: new Date().toISOString()
  };

  if (!data.studentID || !data.studentName || !data.college) {
    alert('Please fill in all required fields');
    return;
  }

  const studentId = document.getElementById('studentID').dataset.studentId;
  let savePromise;

  if (studentId) {
    savePromise = db.ref(`students/${studentId}`).update(data);
  } else {
    savePromise = db.ref('students').push(data);
  }

  savePromise.then(() => {
    generateAndDisplayQR(data.studentID);
    setTimeout(() => {
      loadStudents();
      closeStudentModal();
    }, 2000);
  });
}

function generateAndDisplayQR(studentID) {
  const qrCodeContainer = document.getElementById('qrCodeDisplay');
  qrCodeContainer.innerHTML = '';
  
  QRCode.toCanvas(document.getElementById('qrCodeDisplay'), studentID, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }, (error) => {
    if (error) console.error(error);
    else {
      document.getElementById('btnDownloadQR').classList.remove('hidden');
      document.getElementById('btnDownloadQR').onclick = () => downloadQR(studentID);
    }
  });
}

function downloadQR(studentID) {
  const canvas = document.getElementById('qrCodeDisplay').querySelector('canvas');
  const link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = `student_${studentID}_qr.png`;
  link.click();
}

function editStudent(studentId) {
  const student = studentsData.find(s => s.id === studentId);
  if (!student) return;

  document.getElementById('studentModalTitle').textContent = 'Edit Student';
  document.getElementById('studentID').value = student.studentID;
  document.getElementById('studentName').value = student.studentName;
  document.getElementById('studentEmail').value = student.email;
  document.getElementById('studentCollege').value = student.college;
  document.getElementById('studentYear').value = student.year;
  document.getElementById('studentCourse').value = student.course;
  document.getElementById('studentID').dataset.studentId = studentId;
  
  generateAndDisplayQR(student.studentID);
  document.getElementById('btnDeleteStudent').classList.remove('hidden');
  document.getElementById('studentModal').classList.remove('hidden');
}

function deleteStudent(studentId) {
  if (currentAdminRole === 'super-admin') {
    if (confirm('Are you sure you want to delete this student?')) {
      db.ref(`students/${studentId}`).remove().then(() => {
        loadStudents();
      });
    }
  } else {
    alert('Only Super Admins can delete students');
  }
}

function closeStudentHistoryModal() {
  document.getElementById('studentHistoryModal').classList.add('hidden');
}

function viewStudentHistory(studentId, studentName) {
  document.getElementById('studentHistoryTitle').textContent = `${studentName} - Visit History`;
  document.getElementById('studentHistoryModal').classList.remove('hidden');
  
  db.ref('visitorsLog').orderByChild('studentID').equalTo(studentsData.find(s => s.id === studentId)?.studentID).once('value', snapshot => {
    const visits = snapshot.val() ? Object.values(snapshot.val()) : [];
    const tbody = document.getElementById('visitsHistoryBody');
    tbody.innerHTML = '';

    visits.forEach(visit => {
      const row = document.createElement('tr');
      const date = new Date(visit.timeInMs).toLocaleDateString();
      const inTime = visit.timeIn.split(' ')[1];
      const outTime = visit.timeOut ? visit.timeOut.split(' ')[1] : '--';
      const duration = visit.timeOutMs ? Math.round((visit.timeOutMs - visit.timeInMs) / 60000) + ' min' : '--';

      row.innerHTML = `
        <td>${date}</td>
        <td>${inTime}</td>
        <td>${outTime}</td>
        <td>${duration}</td>
        <td>${visit.reason}</td>
        <td>${visit.status || 'Completed'}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function searchStudents() {
  const query = document.getElementById('studentSearch').value.toLowerCase();
  const filtered = studentsData.filter(student =>
    student.studentName.toLowerCase().includes(query) ||
    student.studentID.includes(query)
  );
  renderStudentGrid(filtered);
}

function switchTab(event) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));

  event.target.classList.add('active');
  const tabName = event.target.dataset.tab;
  document.getElementById(`${tabName}TabContent`).classList.remove('hidden');
}

// ============================================
// USER MANAGEMENT
// ============================================

function loadUsers() {
  db.ref('users').once('value', snapshot => {
    usersData = snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
    renderUsersTable(usersData);
  });
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = '';

  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="role-badge">${getRoleLabel(user.role)}</span></td>
      <td><span class="status-badge ${user.status === 'Active' ? 'status-active' : 'status-inactive'}">${user.status}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn-small" onclick="editUser('${user.id}')">Edit</button>
        ${currentAdminRole === 'super-admin' ? `<button class="btn-small btn-danger" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getRoleLabel(role) {
  const labels = {
    'super-admin': '👑 Super Admin',
    'librarian': '📚 Librarian',
    'staff': '👤 Staff'
  };
  return labels[role] || role;
}

function getPermissions(role) {
  const permissions = {
    'super-admin': [
      'View all reports and analytics',
      'Manage books (add/edit/delete)',
      'Manage students (add/edit/delete)',
      'Manage users and roles',
      'Delete visitor logs',
      'Scan QR codes'
    ],
    'librarian': [
      'View reports',
      'Manage books (add/edit)',
      'Scan QR codes',
      'View visitor logs',
      'Cannot delete logs or users'
    ],
    'staff': [
      'View reports (read-only)',
      'View student records',
      'View books catalog'
    ]
  };
  return permissions[role] || [];
}

function openUserModal() {
  document.getElementById('userModalTitle').textContent = 'Add New User';
  document.getElementById('userName').value = '';
  document.getElementById('userEmail').value = '';
  document.getElementById('userRole').value = '';
  document.getElementById('userStatus').value = 'Active';
  document.getElementById('btnDeleteUser').classList.add('hidden');
  document.getElementById('userModal').classList.remove('hidden');
  updatePermissionsList();
}

function closeUserModal() {
  document.getElementById('userModal').classList.add('hidden');
}

function updatePermissionsList() {
  const role = document.getElementById('userRole').value;
  const permissions = getPermissions(role);
  const list = document.getElementById('permissionsList');
  list.innerHTML = '';

  if (permissions.length > 0) {
    permissions.forEach(perm => {
      const li = document.createElement('li');
      li.textContent = perm;
      list.appendChild(li);
    });
  }
}

function saveUser() {
  const data = {
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    role: document.getElementById('userRole').value,
    status: document.getElementById('userStatus').value,
    createdAt: new Date().toISOString()
  };

  if (!data.name || !data.email || !data.role) {
    alert('Please fill in all required fields');
    return;
  }

  const userId = document.getElementById('userName').dataset.userId;
  if (userId) {
    db.ref(`users/${userId}`).update(data).then(() => {
      loadUsers();
      closeUserModal();
    });
  } else {
    db.ref('users').push(data).then(() => {
      loadUsers();
      closeUserModal();
    });
  }
}

function editUser(userId) {
  const user = usersData.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userName').value = user.name;
  document.getElementById('userEmail').value = user.email;
  document.getElementById('userRole').value = user.role;
  document.getElementById('userStatus').value = user.status;
  document.getElementById('userName').dataset.userId = userId;
  updatePermissionsList();
  document.getElementById('btnDeleteUser').classList.remove('hidden');
  document.getElementById('userModal').classList.remove('hidden');
}

function deleteUser(userId) {
  if (currentAdminRole === 'super-admin') {
    if (confirm('Are you sure you want to delete this user?')) {
      db.ref(`users/${userId}`).remove().then(() => {
        loadUsers();
      });
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function loadAllData() {
  loadAdminRole();
  updateAttendanceStats();
}

// Auto-refresh logger
setInterval(() => {
  if (document.getElementById('section-logger') && !document.getElementById('section-logger').classList.contains('hidden')) {
    loadLogger();
  }
}, 5000);

auth.onAuthStateChanged(user => {
  currentUser = user;
  updateGoogleSignupUI();

  // Handle admin login page
  if (document.getElementById('loginSection')) {
    if (user) {
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('roleSelection').classList.remove('hidden');
      document.getElementById('googleUserName').textContent = user.displayName || user.email;
    } else {
      document.getElementById('loginSection').classList.remove('hidden');
      document.getElementById('roleSelection').classList.add('hidden');
    }
  }

  // Handle main page admin state
  if (document.getElementById('mainContainer')) {
    updateAdminUI();
  }
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

      if (err.code === 'auth/unauthorized-domain') {
        alert("ERROR: Domain not authorized!");
      } else if (err.code === 'auth/operation-not-allowed') {
        alert("Enable Google Sign-In in Firebase!");
      } else {
        alert("Google Sign-in Error: " + err.message);
      }
    });
}

function handleGoogleSignOut() {
  auth.signOut();
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminEmail');
  switchTab('timein');
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
  const adminRole = localStorage.getItem('adminRole');
  const adminEmail = localStorage.getItem('adminEmail');

  // Check if admin sections require login
  if (['admin', 'books', 'students'].includes(tab)) {
    if (!adminRole || !adminEmail) {
      alert('Please login as administrator first.');
      window.location.href = 'LogIn.html';
      return;
    }
  }

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

  // Hide all sections
  document.getElementById('section-timein').classList.add('hidden');
  document.getElementById('section-admin').classList.add('hidden');
  document.getElementById('section-books').classList.add('hidden');
  document.getElementById('section-students').classList.add('hidden');

  // Show selected section
  document.getElementById('section-' + tab).classList.remove('hidden');

  // Update navigation
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const activeLink = document.getElementById('link-' + tab);
  if (activeLink) activeLink.classList.add('active');

  // Update logout button visibility
  const logoutBtn = document.getElementById('logout-btn');
  if (adminRole) {
    logoutBtn.classList.remove('hidden');
  } else {
    logoutBtn.classList.add('hidden');
  }

  // Load data for specific tabs
  if (tab === 'admin') {
    loadAnalytics();
    loadUserDB();
    loadLiveLogs();
  } else if (tab === 'timein') {
    loadDashboardStats();
  } else if (tab === 'books') {
    loadBooks();
  } else if (tab === 'students') {
    loadStudents();
  }
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

function checkPermission(action) {
  const role = localStorage.getItem('adminRole');
  const permissions = {
    'super-admin': ['delete_users', 'delete_logs', 'manage_admins'],
    'librarian': ['scan', 'edit_books', 'view_logs'],
    'staff': ['scan', 'view_logs']
  };

  return permissions[role]?.includes(action) || false;
}

function deleteUser(userId) {
  if (!checkPermission('delete_users')) {
    alert('You do not have permission to delete users.');
    return;
  }

  if (confirm('Delete this user? This action cannot be undone.')) {
    db.ref('users/' + userId).remove();
  }
}

function updateBulkBtn() {
  const checkboxes = document.querySelectorAll('.log-check:checked');
  document.getElementById('btnBulkDelete').style.display = checkboxes.length > 0 ? 'inline-block' : 'none';
}

function deleteSelectedLogs() {
  if (!checkPermission('delete_logs')) {
    alert('You do not have permission to delete logs.');
    return;
  }

  const checkboxes = document.querySelectorAll('.log-check:checked');
  if (checkboxes.length === 0) return;

  if (confirm(`Delete ${checkboxes.length} logs?`)) {
    checkboxes.forEach(cb => db.ref('logs/' + cb.dataset.logKey).remove());
  }
}

function toggleSelectAll(source) {
  const checkboxes = document.querySelectorAll('.log-check');
  checkboxes.forEach(cb => { cb.checked = source.checked; });
  updateBulkBtn();
}

function loadBooks() {
  db.ref('books').on('value', snap => {
    const bookGrid = document.getElementById('bookGrid');
    let html = '';

    snap.forEach(child => {
      const book = child.val();
      const statusClass = book.status.toLowerCase();
      html += `
        <div class="book-card ${statusClass}">
          <h4>${book.title}</h4>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
          <p><strong>Category:</strong> ${book.category}</p>
          <span class="status-badge ${statusClass}">${book.status}</span>
          <div class="book-actions">
            <button onclick="borrowBook('${child.key}')" class="btn-borrow">Borrow</button>
            <button onclick="editBook('${child.key}')" class="btn-edit">Edit</button>
            <button onclick="deleteBook('${child.key}')" class="btn-delete">Delete</button>
          </div>
        </div>
      `;
    });

    bookGrid.innerHTML = html || '<p>No books found.</p>';
  });
}

function loadStudents() {
  db.ref('users').on('value', snap => {
    const studentGrid = document.getElementById('studentGrid');
    let html = '';

    snap.forEach(child => {
      const student = child.val();
      html += `
        <div class="student-card">
          <img src="${student.photo}" alt="Profile" class="student-photo">
          <div class="student-info">
            <h4>${student.name}</h4>
            <p><strong>ID:</strong> ${child.key.replace(/_/g, '.')}</p>
            <p><strong>Course:</strong> ${student.course}</p>
            <p><strong>Department:</strong> ${student.dept}</p>
            <div id="qr-${child.key}" class="student-qr"></div>
          </div>
          <div class="student-actions">
            <button onclick="viewStudentHistory('${child.key}')" class="btn-history">History</button>
            <button onclick="generateStudentQR('${child.key}')" class="btn-qr">Show QR</button>
            <button onclick="editStudent('${child.key}')" class="btn-edit">Edit</button>
          </div>
        </div>
      `;
    });

    studentGrid.innerHTML = html || '<p>No students found.</p>';
  });
}

function generateStudentQR(studentId) {
  const qrContainer = document.getElementById(`qr-${studentId}`);
  if (qrContainer.innerHTML) {
    qrContainer.innerHTML = '';
    return;
  }

  QRCode.toCanvas(studentId.replace(/_/g, '.'), { width: 100, height: 100 }, (error, canvas) => {
    if (error) console.error(error);
    else qrContainer.appendChild(canvas);
  });
}

function loadDashboardStats() {
  const today = new Date().toLocaleDateString();

  db.ref('logs').on('value', snap => {
    let totalToday = 0;
    let activeUsers = new Set();
    let collegeStats = {};
    let hourStats = {};

    snap.forEach(child => {
      const log = child.val();
      if (log.date === today) {
        totalToday++;

        // Count active users (assuming no time out means still active)
        if (!log.timeOut) {
          activeUsers.add(log.id);
        }

        // College breakdown
        collegeStats[log.dept] = (collegeStats[log.dept] || 0) + 1;

        // Peak hours
        const hour = new Date(`${log.date} ${log.time}`).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      }
    });

    // Update stats
    document.getElementById('totalVisitors').textContent = totalToday;
    document.getElementById('activeUsers').textContent = activeUsers.size;

    // Find peak hour
    let peakHour = 0;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourStats)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }
    document.getElementById('peakHour').textContent = `${peakHour}:00`;

    // Update college chart
    updateCollegeChart(collegeStats);
    updatePeakHoursChart(hourStats);
  });
}

function updateCollegeChart(collegeStats) {
  const ctx = document.getElementById('collegeChart').getContext('2d');
  if (collegeChart) collegeChart.destroy();

  collegeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(collegeStats),
      datasets: [{
        data: Object.values(collegeStats),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function updatePeakHoursChart(hourStats) {
  const ctx = document.getElementById('peakHoursChart').getContext('2d');
  if (peakHoursChart) peakHoursChart.destroy();

  const hours = Array.from({length: 24}, (_, i) => i);
  const data = hours.map(hour => hourStats[hour] || 0);

  peakHoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map(h => `${h}:00`),
      datasets: [{
        label: 'Visits',
        data: data,
        backgroundColor: 'rgba(0, 100, 0, 0.6)',
        borderColor: 'rgba(0, 100, 0, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Book Management Functions
function showBookModal(bookId = null) {
  const modal = document.getElementById('bookModal');
  const title = document.getElementById('bookModalTitle');

  if (bookId) {
    title.textContent = 'Edit Book';
    // Load book data for editing
    db.ref('books/' + bookId).once('value', snap => {
      const book = snap.val();
      document.getElementById('bookTitle').value = book.title;
      document.getElementById('bookAuthor').value = book.author;
      document.getElementById('bookISBN').value = book.isbn;
      document.getElementById('bookCategory').value = book.category;
      document.getElementById('bookStatus').value = book.status;
    });
  } else {
    title.textContent = 'Add New Book';
    // Clear form
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookISBN').value = '';
    document.getElementById('bookCategory').value = '';
    document.getElementById('bookStatus').value = 'Available';
  }

  document.getElementById('btnSaveBook').onclick = () => saveBook(bookId);
  modal.classList.remove('hidden');
}

function saveBook(bookId) {
  const book = {
    title: document.getElementById('bookTitle').value,
    author: document.getElementById('bookAuthor').value,
    isbn: document.getElementById('bookISBN').value,
    category: document.getElementById('bookCategory').value,
    status: document.getElementById('bookStatus').value
  };

  if (bookId) {
    db.ref('books/' + bookId).update(book);
  } else {
    db.ref('books').push(book);
  }

  document.getElementById('bookModal').classList.add('hidden');
}

function deleteBook(bookId) {
  if (confirm('Delete this book?')) {
    db.ref('books/' + bookId).remove();
  }
}

function borrowBook(bookId) {
  // This would typically require student ID input
  const studentId = prompt('Enter Student ID:');
  if (studentId) {
    db.ref('books/' + bookId).update({ status: 'Borrowed', borrowedBy: studentId });
  }
}

// Student Management Functions
function showStudentModal(studentId = null) {
  const modal = document.getElementById('studentModal');
  const title = document.getElementById('studentModalTitle');

  if (studentId) {
    title.textContent = 'Edit Student';
    // Load student data for editing
    db.ref('users/' + studentId).once('value', snap => {
      const student = snap.val();
      document.getElementById('studentID').value = studentId.replace(/_/g, '.');
      document.getElementById('studentName').value = student.name;
      document.getElementById('studentEmail').value = student.email || '';
      document.getElementById('studentDept').value = student.dept;
      document.getElementById('studentYear').value = student.year;
      document.getElementById('studentCourse').value = student.course;
    });
  } else {
    title.textContent = 'Add New Student';
    // Clear form
    document.getElementById('studentID').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentDept').value = 'CICS';
    document.getElementById('studentYear').value = '1st Year';
    document.getElementById('studentCourse').value = '';
  }

  document.getElementById('btnSaveStudent').onclick = () => saveStudent(studentId);
  modal.classList.remove('hidden');
}

function saveStudent(studentId) {
  const id = document.getElementById('studentID').value.replace(/\./g, '_');
  const student = {
    name: document.getElementById('studentName').value,
    email: document.getElementById('studentEmail').value,
    dept: document.getElementById('studentDept').value,
    year: document.getElementById('studentYear').value,
    course: document.getElementById('studentCourse').value,
    type: 'Student',
    photo: 'https://via.placeholder.com/150'
  };

  if (studentId) {
    db.ref('users/' + studentId).update(student);
  } else {
    db.ref('users/' + id).set(student);
  }

  // Generate QR code
  const qrContainer = document.getElementById('qrCodeDisplay');
  qrContainer.innerHTML = '';
  QRCode.toCanvas(id.replace(/_/g, '.'), { width: 150, height: 150 }, (error, canvas) => {
    if (!error) qrContainer.appendChild(canvas);
  });

  document.getElementById('studentModal').classList.add('hidden');
}

function viewStudentHistory(studentId) {
  // This would show a modal with student's visit history
  alert('Student history feature - would show visit logs for this student');
}

function editStudent(studentId) {
  showStudentModal(studentId);
}

function filterBooks() {
  const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
  const cards = document.querySelectorAll('.book-card');

  cards.forEach(card => {
    const title = card.querySelector('h4').textContent.toLowerCase();
    const author = card.querySelector('p').textContent.toLowerCase();
    const visible = title.includes(searchTerm) || author.includes(searchTerm);
    card.style.display = visible ? 'block' : 'none';
  });
}

function filterStudents() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const cards = document.querySelectorAll('.student-card');

  cards.forEach(card => {
    const name = card.querySelector('h4').textContent.toLowerCase();
    const course = card.querySelector('p').textContent.toLowerCase();
    const visible = name.includes(searchTerm) || course.includes(searchTerm);
    card.style.display = visible ? 'block' : 'none';
  });
}

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
  document.getElementById('link-books').addEventListener('click', () => switchTab('books'));
  document.getElementById('link-students').addEventListener('click', () => switchTab('students'));
  document.getElementById('logout-btn').addEventListener('click', () => {
    handleGoogleSignOut();
    switchTab('timein');
  });

  // QR Scanner
  document.getElementById('btnManualInput').addEventListener('click', () => switchInputMethod('manual'));
  document.getElementById('btnQRScan').addEventListener('click', () => switchInputMethod('qr'));
  document.getElementById('btnStartScan').addEventListener('click', startQRScan);
  document.getElementById('btnStopScan').addEventListener('click', stopQRScan);

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

  // Book management
  document.getElementById('btnAddBook').addEventListener('click', () => showBookModal());
  document.getElementById('closeBookModal').addEventListener('click', () => {
    document.getElementById('bookModal').classList.add('hidden');
  });

  // Student management
  document.getElementById('btnAddStudent').addEventListener('click', () => showStudentModal());
  document.getElementById('closeStudentModal').addEventListener('click', () => {
    document.getElementById('studentModal').classList.add('hidden');
  });

  // Search functionality
  document.getElementById('bookSearch').addEventListener('input', filterBooks);
  document.getElementById('studentSearch').addEventListener('input', filterStudents);
}

window.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  switchTab('timein');
  switchAuthTab('login');
  loadDashboardStats(); // Load initial dashboard data
});