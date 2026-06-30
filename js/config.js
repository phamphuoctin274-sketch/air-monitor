// Cấu hình mặc định
const DEFAULT_FIREBASE_HOST = "https://forest-air-polution-default-rtdb.firebaseio.com/";
const DEFAULT_FIREBASE_AUTH = "cMDFoQZvSQkiPGsma96pBIwxrOtc9dBOACHwidQN";
const DEFAULT_FIREBASE_PATH = "AirQuality";

// Biến toàn cục
let firebaseHost = DEFAULT_FIREBASE_HOST;
let firebaseAuth = DEFAULT_FIREBASE_AUTH;
let firebasePath = DEFAULT_FIREBASE_PATH;

// Hàm load cấu hình từ localStorage
function loadConfigFromStorage() {
    const storedHost = localStorage.getItem('firebaseHost');
    const storedAuth = localStorage.getItem('firebaseAuth');
    const storedPath = localStorage.getItem('firebasePath');
    if (storedHost) firebaseHost = storedHost;
    if (storedAuth) firebaseAuth = storedAuth;
    if (storedPath !== null) firebasePath = storedPath;
}

// Hàm lưu cấu hình
function saveConfig() {
    const newHost = document.getElementById('firebaseHost').value.trim();
    const newAuth = document.getElementById('firebaseAuth').value.trim();
    const newPath = document.getElementById('firebasePath').value.trim();
    if (!newHost || !newAuth) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return false;
    }
    // Thêm / vào cuối nếu chưa có
    firebaseHost = newHost.endsWith('/') ? newHost : newHost + '/';
    firebaseAuth = newAuth;
    firebasePath = newPath;

    localStorage.setItem('firebaseHost', firebaseHost);
    localStorage.setItem('firebaseAuth', firebaseAuth);
    localStorage.setItem('firebasePath', firebasePath);
    
    document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-plug me-1"></i>Đã kết nối';
    document.getElementById('connectionStatus').classList.add('bg-success');
    document.getElementById('connectionStatus').classList.remove('bg-danger');
    return true;
}

// Khôi phục mặc định
function resetToDefaultConfig() {
    firebaseHost = DEFAULT_FIREBASE_HOST;
    firebaseAuth = DEFAULT_FIREBASE_AUTH;
    firebasePath = DEFAULT_FIREBASE_PATH;
    document.getElementById('firebaseHost').value = firebaseHost;
    document.getElementById('firebaseAuth').value = firebaseAuth;
    document.getElementById('firebasePath').value = firebasePath;
    localStorage.setItem('firebaseHost', firebaseHost);
    localStorage.setItem('firebaseAuth', firebaseAuth);
    localStorage.setItem('firebasePath', firebasePath);
    alert('Đã khôi phục cấu hình mặc định!');
}