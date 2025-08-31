// 현재 선택된 날짜
let selectedDate = new Date();

// 매일 순서대로 나타나는 문구 배열
const dailyQuotes = [
    "너~무 작은 아이에게 너무 많~은 것을 기대하지 말자.",
    "평생 전쟁을 해야 한다. 한 번의 전쟁에서 지더라도 그 전쟁에 모든 것을 걸 수는 없다.",
    "아이에게 아침의 여유로움과 즐거움을 알게 해주기.",
    "일찍 잠들기, 절대 짜증내지 않기.",
    "기분 좋은 음악과 목소리를 들으며 잠에서 깰 수 있는 환경 마련하기.",
    "그 자리에서 말하지 말고, 다음 번 조용히 대화하는 시간에 말하기.",
    "부모님께 일주일에 한 번 전화하기.",
    "아이에게 그 정도로 화내고 짜증낼 건 아니다. 그럴만한 일은 세상에 존재하지 않는다.",
    "흘러흘러 나비의 날갯짓, 나의 날갯짓… 책임의 끝이 파멸의 시작이 아닐까.",
    "아이에게 줄 수 있는 가장 큰 선물은 웃음이 아닐까? 세상을 행복하게 바라볼 수 있는 힘을 키워주는 건 엄마 아빠의 행복한 웃음.",
    "사람들이 가장 위로를 받을 때는 나와 같은 처지에 있는 사람들이 있다는 것을 알 때, 그리고 그 일에 대해 공감하며 이야기를 나눌 때가 아닐까."
];

// 매일 문구 표시 함수
function displayDailyQuote() {
    const quoteElement = document.getElementById('daily-quote');
    if (!quoteElement) return;
    
    // 오늘 날짜를 기준으로 문구 선택 (0부터 시작하는 인덱스)
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % dailyQuotes.length;
    
    quoteElement.textContent = dailyQuotes[quoteIndex];
}

// 날짜 표시 업데이트
function updateDateDisplay() {
    // 날짜가 유효하지 않으면 오늘로 대체
    if (!(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        selectedDate = new Date();
    }
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long'
    };
    const dateStr = selectedDate.toLocaleDateString('ko-KR', options);
    // 한글 날짜 표시 요소가 있을 때만 값 변경
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = dateStr;
    
    // date input 업데이트
    const dateInput = document.getElementById('datePicker');
    if (dateInput) {
        dateInput.value = formatDateForInput(selectedDate);
    }
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
        if (!data.mealServiceDietInfo || !data.mealServiceDietInfo[1] || !data.mealServiceDietInfo[1].row) {
            return [];
        }
        // 급식 정보 파싱
        const mealInfo = data.mealServiceDietInfo[1].row[0];
        if (!mealInfo || !mealInfo.DDISH_NM) return [];
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

    let menuItems = [];
    try {
        menuItems = await fetchMealInfo(selectedDate);
    } catch (e) {
        console.error('fetchMealInfo error:', e);
    }
    displayMenu(menuItems);
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 초기 날짜 표시
    updateDateDisplay();
    
    // 매일 문구 표시
    displayDailyQuote();
    
    // 날짜 선택 이벤트
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
        datePicker.value = formatDateForInput(selectedDate);
        datePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedDate = new Date(e.target.value);
            } else {
                selectedDate = new Date();
            }
            updateDateDisplay();
            fetchAndDisplayMenu();
        });
    }

    // 초기 급식 정보 로드
    fetchAndDisplayMenu();
});
