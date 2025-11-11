console.log("LLM Helper (v0.4) 실행 중");

// 팝업으로 쓸 HTML 요소를 미리 만들어 둡니다.
const popup = document.createElement('div');
popup.className = 'lmm-popup';
document.body.appendChild(popup);

// 한국어 문자인지 확인하는 정규식
const isKorean = (text) => /[\u3131-\uD79D]/.test(text);

// 'dblclick' (더블클릭) 이벤트 리스너 - [영영사전]
document.addEventListener('dblclick', async function(event) {
  let selectedText = window.getSelection().toString().trim();
  
  // 한국어가 아니고, 15글자 미만(단어)일 때만 영영사전 호출
  if (selectedText && !isKorean(selectedText) && selectedText.length < 15) {
    console.log("영영사전 호출:", selectedText);
    const engDefinition = await getEngDefinition(selectedText);
    // 팝업 띄우기 (원문, 결과)
    showPopup(selectedText, engDefinition, event);
  }
});

// 'mouseup' (마우스 드래그 끝) 이벤트 리스너 - [번역]
document.addEventListener('mouseup', async function(event) {
  let selectedText = window.getSelection().toString().trim();
  
  // 텍스트가 있고, (한국어이거나 || 15글자 이상일 때) 번역 호출
  if (selectedText && (isKorean(selectedText) || selectedText.length >= 15)) {
    
    // dblclick으로 이미 팝업이 뜬 상태면 무시 (중복 방지)
    if (popup.style.display === 'block' && popup.innerHTML.includes(selectedText)) {
      return;
    }

    console.log("번역 호출:", selectedText);
    
    let sourceLang, targetLang;
    
    if (isKorean(selectedText)) {
      // [한->영 번역]
      sourceLang = 'ko';
      targetLang = 'en';
    } else {
      // [영->한 번역]
      sourceLang = 'en';
      targetLang = 'ko';
    }

    const translation = await getTranslation(selectedText, sourceLang, targetLang);
    // 팝업 띄우기 (원문, 결과)
    showPopup(selectedText, translation, event);
  }
});

/**
 * [API 1] 영-영 사전 (DictionaryAPI.dev)
 */
async function getEngDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) return "단어의 뜻을 찾을 수 없습니다.";
    const data = await response.json();
    return data[0].meanings[0].definitions[0].definition; // 첫 번째 뜻만 가져옴
  } catch (error) {
    return "영-영 사전 오류";
  }
}

/**
 * [API 2] 키 없는 구글 번역 (googleapis)
 * @param {string} text - 번역할 텍스트
 * @param {string} sourceLang - 출발 언어 (e.g., 'en')
 * @param {string} targetLang - 도착 언어 (e.g., 'ko')
 */
async function getTranslation(text, sourceLang, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return "번역 실패";
    
    const data = await response.json();
    // 구글 번역 API는 결과가 data[0][n][0]에 있습니다.
    const count = data[0].length;
    let dt = []
    for (var i =0 ; i < count ; i++){dt.push(data[0][i][0])}
    
    return dt.join(" ");
  } catch (error) {
    return "번역 API 오류";
  }
}

/**
 * 팝업을 화면에 보여주는 함수 (v0.4)
 */
function showPopup(originalText, resultText, event) {
  popup.innerHTML = `
    <div class="lmm-popup-original">${originalText}</div>
    <div class="lmm-popup-divider"></div>
    <div class="lmm-popup-result">${resultText}</div>
  `;
  
  // 팝업 위치를 마우스 클릭/드래그 끝난 지점 근처로 설정
  popup.style.left = `${event.pageX + 10}px`;
  popup.style.top = `${event.pageY + 10}px`;
  
  // 팝업 보여주기
  popup.style.display = 'block';
}

// 페이지의 다른 곳을 클릭하면 팝업을 숨깁니다.
document.addEventListener('click', function(event) {
  // 팝업 내부를 클릭한 게 아니라면 숨김
  if (!popup.contains(event.target)) {
    popup.style.display = 'none';
  }
});

// 드래그 시작 시(mousedown) 팝업 숨기기 (기존 팝업이 있다면)
document.addEventListener('mousedown', function(event) {
    if (!popup.contains(event.target)) {
        popup.style.display = 'none';
    }
});
