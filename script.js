// 현재 선택된 날짜
let selectedDate = new Date();

// 날짜 표시 업데이트
function updateDateDisplay() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long'
    };
    const dateStr = selectedDate.toLocaleDateString('ko-KR', options);
    document.getElementById('current-date').textContent = dateStr;
    
    // date input 업데이트
    const dateInput = document.getElementById('datePicker');
    dateInput.value = formatDateForInput(selectedDate);
}

// YYYY-MM-DD 형식으로 날짜 변환 (input type="date"용)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// YYYYMMDD 형식으로 날짜 변환 (API용)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 날짜 변경 (이전/다음 버튼)
function changeDate(days) {
    selectedDate = new Date(selectedDate.setDate(selectedDate.getDate() + days));
    updateDateDisplay();
    fetchAndDisplayMenu();
}

// 오늘 날짜로 이동
function goToToday() {
    selectedDate = new Date();
    updateDateDisplay();
    fetchAndDisplayMenu();
}

// 급식 정보 가져오기
async function fetchMealInfo(date) {
    const ATPT_OFCDC_SC_CODE = 'B10';  // 시도교육청코드
    const SD_SCHUL_CODE = '7091374';   // 학교코드
    const MLSV_YMD = formatDate(date); // 날짜

    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo` +
                `?ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}` +
                `&SD_SCHUL_CODE=${SD_SCHUL_CODE}` +
                `&MLSV_YMD=${MLSV_YMD}` +
                `&Type=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.RESULT) {
            return []; // 데이터가 없는 경우
        }

        // 급식 정보 파싱
        const mealInfo = data.mealServiceDietInfo[1].row[0];
        const dishes = mealInfo.DDISH_NM.split('<br/>');
        
        // 알레르기 정보 제거 및 정리
        return dishes.map(dish => {
            return dish.replace(/\(\d+\.\d+\)/g, '')
                      .replace(/\(\d+\)/g, '')
                      .trim();
        });
    } catch (error) {
        console.error('급식 정보를 가져오는데 실패했습니다:', error);
        return [];
    }
}

// 메뉴 표시
function displayMenu(menuItems) {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';

    if (menuItems.length === 0) {
        menuList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                해당 날짜의 급식 정보가 없습니다.
            </div>`;
        return;
    }

    menuItems.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item list-group-item';
        menuItem.style.setProperty('--index', index);
        menuItem.innerHTML = `<img src="Picture/양파로고2.png" class="menu-icon" alt="onion icon" /> ${item}`;
        menuList.appendChild(menuItem);
    });
}

// 급식 정보 가져오기 및 표시
async function fetchAndDisplayMenu() {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">급식 정보를 불러오는 중...</p>
        </div>
    `;

    const menuItems = await fetchMealInfo(selectedDate);
    displayMenu(menuItems);
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 초기 날짜 표시
    updateDateDisplay();
    
    // 날짜 선택 이벤트
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', (e) => {
        selectedDate = new Date(e.target.value);
        updateDateDisplay();
        fetchAndDisplayMenu();
    });

    // 초기 급식 정보 로드
    fetchAndDisplayMenu();
});
