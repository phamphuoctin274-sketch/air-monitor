// auth.js - Hỗ trợ Demo (localStorage) + Firebase Authentication

const firebaseConfig = {
    apiKey: "AIzaSyDQ8JMaSKdGnhWRJSwzSGFmGn9DlY8m6BU",
    authDomain: "forest-air-polution.firebaseapp.com",
    databaseURL: "https://forest-air-polution-default-rtdb.firebaseio.com",
    projectId: "forest-air-polution",
    storageBucket: "forest-air-polution.firebasestorage.app",
    messagingSenderId: "544076590819",
    appId: "1:544076590819:web:0226d70d70175d3e559fd6"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// === HÀM LẤY DANH SÁCH ADMIN TỪ LOCAL ===
function getLocalAdminEmails() {
    const accounts = deepAirGetAccounts();
    return accounts.filter(acc => acc.role === 'admin').map(acc => acc.email).filter(Boolean);
}

// === XÁC ĐỊNH ROLE DỰA TRÊN EMAIL ===
function getUserRole(email) {
    if (!email) return 'user';
    const adminEmails = getLocalAdminEmails();
    // Thêm email admin cố định nếu muốn (phòng trường hợp)
    const fixedAdmins = ['phamphuoctin274@gmail.com', 'admin@gmail.com'];
    const allAdmins = [...new Set([...adminEmails, ...fixedAdmins])];
    return allAdmins.includes(email.toLowerCase()) ? 'admin' : 'user';
}

// === QUẢN LÝ SESSION ===
function setSession(user) {
    const role = getUserRole(user.email);
    localStorage.setItem('deepAirLoggedIn', 'true');
    localStorage.setItem('deepAirUser', user.displayName || user.email);
    localStorage.setItem('deepAirEmail', user.email);
    localStorage.setItem('deepAirRole', role);
    localStorage.setItem('deepAirUsername', user.email);
}

function setDemoSession(username, displayName, role) {
    localStorage.setItem('deepAirLoggedIn', 'true');
    localStorage.setItem('deepAirUser', displayName || username);
    localStorage.setItem('deepAirEmail', '');
    localStorage.setItem('deepAirRole', role || 'admin');
    localStorage.setItem('deepAirUsername', username);
}

function clearSession() {
    localStorage.removeItem('deepAirLoggedIn');
    localStorage.removeItem('deepAirUser');
    localStorage.removeItem('deepAirEmail');
    localStorage.removeItem('deepAirRole');
    localStorage.removeItem('deepAirUsername');
}

function isDeepAirLoggedIn() {
    return localStorage.getItem('deepAirLoggedIn') === 'true';
}

function getDeepAirCurrentUser() {
    return localStorage.getItem('deepAirUser') || 'Người dùng';
}

function getDeepAirCurrentUsername() {
    return localStorage.getItem('deepAirUsername') || '';
}

function getDeepAirCurrentRole() {
    return localStorage.getItem('deepAirRole') || '';
}

function isDeepAirAdmin() {
    return getDeepAirCurrentRole() === 'admin';
}

// === QUẢN LÝ TÀI KHOẢN LOCAL ===
const DEEP_AIR_ACCOUNT_KEY = "deepAirAccounts";
const DEEP_AIR_DEFAULT_ACCOUNTS = [
    {
        username: "admin",
        password: "Admin@123",
        displayName: "Quản trị viên",
        role: "admin",
        email: "",
        recoveryCode: "HCMUTE2026",
        createdAt: "2026-06-30"
    }
];

function deepAirNormalize(text) {
    return String(text || "").trim().toLowerCase();
}

function deepAirSafeParse(jsonText, fallback) {
    try {
        const value = JSON.parse(jsonText);
        return Array.isArray(value) ? value : fallback;
    } catch (error) {
        return fallback;
    }
}

function deepAirGetAccounts() {
    const savedAccounts = deepAirSafeParse(localStorage.getItem(DEEP_AIR_ACCOUNT_KEY), null);
    let accounts = savedAccounts && savedAccounts.length ? savedAccounts : DEEP_AIR_DEFAULT_ACCOUNTS;
    accounts = accounts.map(account => ({
        username: account.username || "",
        password: account.password || "",
        displayName: account.displayName || account.username || "Người dùng",
        role: account.role || "user",
        email: account.email || "",
        recoveryCode: account.recoveryCode || "",
        createdAt: account.createdAt || new Date().toISOString().slice(0, 10)
    }));
    const adminExists = accounts.some(acc => acc.role === 'admin');
    if (!adminExists) {
        accounts.unshift(DEEP_AIR_DEFAULT_ACCOUNTS[0]);
    }
    localStorage.setItem(DEEP_AIR_ACCOUNT_KEY, JSON.stringify(accounts));
    return accounts;
}

function deepAirSaveAccounts(accounts) {
    localStorage.setItem(DEEP_AIR_ACCOUNT_KEY, JSON.stringify(accounts));
}

function deepAirAddAccount(accountData) {
    const accounts = deepAirGetAccounts();
    const existed = accounts.some(acc => deepAirNormalize(acc.username) === deepAirNormalize(accountData.username));
    if (existed) return false;
    accounts.push({
        username: accountData.username,
        password: accountData.password,
        displayName: accountData.displayName || accountData.username,
        role: accountData.role || "user",
        email: accountData.email || "",
        recoveryCode: accountData.recoveryCode || "",
        createdAt: accountData.createdAt || new Date().toISOString().slice(0, 10)
    });
    deepAirSaveAccounts(accounts);
    return true;
}

function deepAirDeleteAccount(username) {
    if (!isDeepAirAdmin()) {
        return { success: false, message: "Chỉ quản trị viên mới được xóa tài khoản." };
    }
    const normalizedUsername = deepAirNormalize(username);
    const accounts = deepAirGetAccounts();
    const adminAccounts = accounts.filter(acc => acc.role === 'admin');
    if (adminAccounts.length === 1 && normalizedUsername === deepAirNormalize(adminAccounts[0].username)) {
        return { success: false, message: "Không thể xóa admin duy nhất." };
    }
    const nextAccounts = accounts.filter(account => deepAirNormalize(account.username) !== normalizedUsername);
    if (accounts.length === nextAccounts.length) {
        return { success: false, message: "Không tìm thấy tài khoản cần xóa." };
    }
    deepAirSaveAccounts(nextAccounts);
    return { success: true, message: "Đã xóa tài khoản thành công." };
}

function deepAirGetAccountDetail(username) {
    const accounts = deepAirGetAccounts();
    const account = accounts.find(acc => deepAirNormalize(acc.username) === deepAirNormalize(username));
    if (!account) return null;
    return { ...account };
}

// ================================================================
// === ĐĂNG NHẬP CHÍNH: KIỂM TRA DEMO TRƯỚC, SAU ĐÓ MỚI FIREBASE ===
// ================================================================
async function deepAirLogin(identifier, password) {
    // BƯỚC 1: KIỂM TRA DEMO (localStorage)
    const demoAccounts = deepAirGetAccounts();
    const demoAccount = demoAccounts.find(acc =>
        deepAirNormalize(acc.username) === deepAirNormalize(identifier) &&
        acc.password === password
    );

    if (demoAccount) {
        // Đăng nhập demo thành công
        setDemoSession(demoAccount.username, demoAccount.displayName, demoAccount.role);
        return {
            success: true,
            user: {
                displayName: demoAccount.displayName,
                email: demoAccount.email || '',
                isDemo: true
            }
        };
    }

    // BƯỚC 2: XÁC ĐỊNH EMAIL (nếu không phải demo)
    let email = identifier;
    let isUsername = !identifier.includes('@');
    if (isUsername) {
        // Nếu không phải email, báo lỗi (không tìm thấy)
        return { success: false, message: 'Tên đăng nhập không tồn tại.' };
    }

    // BƯỚC 3: ĐĂNG NHẬP FIREBASE
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // Khi đăng nhập Firebase thành công, set session với role từ localStorage
        setSession(userCredential.user);
        return { success: true, user: userCredential.user };
    } catch (error) {
        let message = 'Sai email hoặc mật khẩu.';
        if (error.code === 'auth/user-not-found') {
            message = 'Email chưa đăng ký. Vui lòng đăng ký trước.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Sai mật khẩu.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email không hợp lệ.';
        }
        return { success: false, message: message };
    }
}

// === ĐĂNG KÝ FIREBASE ===
async function deepAirRegisterAccount(accountData) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(accountData.email, accountData.password);
        const user = userCredential.user;
        if (accountData.displayName) {
            await user.updateProfile({ displayName: accountData.displayName });
        }
        // Lưu vào localStorage (để đồng bộ danh sách admin)
        const newAccount = {
            username: accountData.username || accountData.email.split('@')[0],
            password: accountData.password,
            displayName: accountData.displayName || accountData.email,
            role: getUserRole(accountData.email),
            email: accountData.email,
            recoveryCode: accountData.recoveryCode || "",
            createdAt: new Date().toISOString().slice(0, 10)
        };
        deepAirAddAccount(newAccount);
        setSession(user);
        return { success: true, message: 'Đăng ký thành công!' };
    } catch (error) {
        let message = 'Đăng ký thất bại.';
        if (error.code === 'auth/email-already-in-use') message = 'Email đã được sử dụng.';
        else if (error.code === 'auth/invalid-email') message = 'Email không hợp lệ.';
        else if (error.code === 'auth/weak-password') message = 'Mật khẩu yếu (tối thiểu 6 ký tự).';
        return { success: false, message: message };
    }
}

// === ĐĂNG NHẬP GOOGLE ===
function deepAirLoginWithGoogle() {
    return auth.signInWithPopup(provider)
        .then(result => {
            setSession(result.user);
            window.location.href = 'overview.html';
        })
        .catch(error => {
            console.error('Lỗi Google:', error);
            const loginErrorBox = document.getElementById('loginErrorBox');
            if (loginErrorBox) {
                loginErrorBox.className = 'message-box error';
                loginErrorBox.textContent = 'Đăng nhập Google thất bại: ' + error.message;
                loginErrorBox.style.display = 'block';
            } else {
                alert('Đăng nhập Google thất bại: ' + error.message);
            }
        });
}

// === QUÊN MẬT KHẨU (FIREBASE) ===
async function deepAirResetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true, message: 'Email khôi phục đã được gửi.' };
    } catch (error) {
        let message = 'Gửi email thất bại.';
        if (error.code === 'auth/user-not-found') message = 'Email không tồn tại.';
        return { success: false, message: message };
    }
}

// === ĐĂNG XUẤT ===
function deepAirLogout() {
    auth.signOut().then(() => {
        clearSession();
        window.location.href = 'index.html';
    }).catch(() => {
        clearSession();
        window.location.href = 'index.html';
    });
}

// === BẢO VỆ TRANG ===
// Lắng nghe thay đổi auth state
auth.onAuthStateChanged(user => {
    if (user) {
        // Nếu đăng nhập Firebase và chưa có session, set session
        if (!localStorage.getItem('deepAirLoggedIn')) {
            setSession(user);
        }
    } else {
        // Nếu không có user Firebase, kiểm tra có đang dùng demo không
        const loggedIn = localStorage.getItem('deepAirLoggedIn');
        const email = localStorage.getItem('deepAirEmail');
        if (loggedIn && !email) {
            // Demo session: giữ nguyên
        } else {
            clearSession();
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const publicPages = ['index.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    if (!publicPages.includes(currentPage) && !isDeepAirLoggedIn()) {
        window.location.href = 'index.html';
    }
    if (currentPage === 'option.html' && !isDeepAirAdmin()) {
        window.location.href = 'overview.html';
    }
    document.querySelectorAll('[data-admin-only="true"]').forEach(el => {
        if (!isDeepAirAdmin()) el.style.display = 'none';
    });
});

// === EXPORT ===
window.deepAirLogin = deepAirLogin;
window.deepAirLoginWithGoogle = deepAirLoginWithGoogle;
window.deepAirRegisterAccount = deepAirRegisterAccount;
window.deepAirResetPassword = deepAirResetPassword;
window.deepAirLogout = deepAirLogout;
window.isDeepAirAdmin = isDeepAirAdmin;
window.getDeepAirCurrentUser = getDeepAirCurrentUser;
window.getDeepAirCurrentRole = getDeepAirCurrentRole;
window.deepAirGetAccounts = deepAirGetAccounts;
window.deepAirDeleteAccount = deepAirDeleteAccount;
window.deepAirGetAccountDetail = deepAirGetAccountDetail;
window.deepAirAddAccount = deepAirAddAccount;
