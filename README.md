# 📚 NEU Library Management System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Download Required Image
- Save your NEU logo as `neu.png` in the same folder as the HTML files
- The logo should be 100x100px or larger (PNG format)

### Step 2: Open the Website
1. **Student Portal:** Open `index.html` in your web browser
2. **Admin Login:** Click "Admin Login" button in the top-right corner

### Step 3: Test the System

#### 👤 As a Student:
- Enter your **8-digit Student ID** or scan a **QR code**
- Select **Reason for Visiting**
- Click **TIME IN →**

#### 👑 As Admin (if logged in):
- Navigate to **Dashboard** → View analytics
- Navigate to **Logger** → See real-time activity
- Navigate to **Books** → Manage book inventory
- Navigate to **Students** → Manage student records
- Navigate to **Users** → Add admins/staff

---

## 🔧 Firebase Setup (REQUIRED)

The system uses Firebase for data storage. To make it work:

1. **Create a Firebase Project:**
   - Go to [firebase.google.com](https://firebase.google.com)
   - Create a new project
   - Enable these services:
     - ✅ Authentication (Google Sign-In)
     - ✅ Realtime Database

2. **Get Your Config:**
   - In Firebase Console → Project Settings → Copy config object
   - Open `script.js` and replace the `firebaseConfig` object

3. **Enable Google Sign-In:**
   - Firebase Console → Authentication → Sign-in Methods
   - Enable "Google" provider
   - Add your domain to "Authorized domains"

4. **Setup Database Rules:**
   ```json
   {
     "rules": {
       ".read": true,
       ".write": "auth != null"
     }
   }
   ```

---

## 📝 Features Overview

| Feature | Access | Function |
|---------|--------|----------|
| **Attendance** | All | Scan QR or enter ID |
| **Dashboard** | Admin | View real-time analytics |
| **Logger** | Admin | Track visitor activity |
| **Books** | Admin | Manage library inventory |
| **Students** | Admin | Generate QR codes |
| **Users** | Super Admin | Manage access roles |

---

## 🔐 Default Admin Roles

- **Super Admin** 👑 - Full access + delete records
- **Librarian** 📚 - Can scan + edit books (no delete)
- **Staff** 👤 - View-only access

---

## ⚙️ Troubleshooting

### ❌ "I can't access the website"
- Check browser console (F12 → Console tab) for errors
- Verify `neu.png` logo file exists
- Check that all 3 files are in the same folder

### ❌ "Login not working"
- Verify Firebase config is updated
- Check network connectivity
- Allow popups for Google Sign-In

### ❌ "Charts not showing"
- Ensure Chart.js library loaded (check F12 → Network tab)
- Check browser console for errors

### ❌ "QR Scanner not working"
- Grant camera permission when prompted
- Use HTTPS or localhost (QR scanner needs secure context)
- Try Chrome or Firefox browsers

---

## 📱 System Requirements

- ✅ Modern web browser (Chrome, Firefox, Edge, Safari)
- ✅ Internet connection (for Firebase)
- ✅ Camera (for QR scanning)
- ✅ JavaScript enabled
- ✅ Cookies enabled

---

## 🎯 Next Steps

1. Set up Firebase project
2. Add your logo (neu.png)
3. Host the files on a web server or Firebase Hosting
4. Test Student Portal → Admin Login → Dashboard
5. Add test data (students, books, users)

---

## 📧 Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify Firebase configuration
3. Test with a different browser
4. Clear cache and cookies, then reload

---

**Version:** 1.0  
**Built:** March 2026  
**Last Updated:** Today
