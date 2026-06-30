// firebase.js - Lấy dữ liệu từ Firebase
async function fetchFirebaseData() {
    try {
        let baseUrl = firebaseHost.replace(/\/$/, '');
        let path = firebasePath ? `/${firebasePath}` : '';
        let url = `${baseUrl}${path}.json?auth=${firebaseAuth}`;
        console.log('Fetching Firebase URL:', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi Firebase:', error);
        document.getElementById('connectionStatus').innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Mất kết nối';
        document.getElementById('connectionStatus').classList.remove('bg-success');
        document.getElementById('connectionStatus').classList.add('bg-danger');
        throw error;
    }
}
