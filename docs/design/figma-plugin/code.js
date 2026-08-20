// 마이뉴티 프로토타입 자동 배선 — 임포트된 화면 프레임에 클릭 연결 생성
const DATA = {"screens": [{"key": "V2Splash", "num": "01", "name": "스플래시", "sig": ["찍으면 나오는, 내 목표 기준 영양 등급"]}, {"key": "V2Consent", "num": "02", "name": "처리방침 동의", "sig": ["확인하고 시작하기", "익명 사용 기록"]}, {"key": "V2CameraAsk", "num": "03", "name": "카메라 안내", "sig": ["카메라는 스캔할 때만 써요"]}, {"key": "V2OnbStart", "num": "04", "name": "온보딩 시작", "sig": ["집에 있는 음식 하나만"]}, {"key": "V2Picker", "num": "05", "name": "픽커(폴백)", "sig": ["평소 먹는 제품을"]}, {"key": "V2OnbScan", "num": "06", "name": "온보딩 스캔", "sig": ["셔터 없이 자동으로 인식돼요"]}, {"key": "V2FirstResult", "num": "07", "name": "첫 결과", "sig": ["생각보다 아쉽죠?"]}, {"key": "V2Goal", "num": "08", "name": "목표 설정", "sig": ["목표를 알려주시면"]}, {"key": "V2Recalc", "num": "09", "name": "재계산 보상", "sig": ["다시 계산했어요"]}, {"key": "V2Scan", "num": "10", "name": "스캔", "sig": ["연속으로 찍으면 결과가 바로 바뀌어요"]}, {"key": "V2Sheet", "num": "11", "name": "결과 시트", "sig": ["카메라는 계속 인식 중"]}, {"key": "FinalResult", "num": "12", "name": "결과 펼침", "sig": ["비교함에 담기"]}, {"key": "V2Detail", "num": "13", "name": "성분 상세", "sig": ["트랜스지방"]}, {"key": "V2NotFound", "num": "14", "name": "미등록(라이트)", "sig": ["곧 추가돼요"]}, {"key": "V2GoalSettings", "num": "15", "name": "목표 변경", "sig": ["기준으로 보고 있어요"]}, {"key": "X2Home", "num": "16", "name": "홈", "sig": ["복사한 상품 링크 붙여넣기"]}, {"key": "X2Ranking", "num": "17", "name": "카테고리 랭킹", "sig": ["선정 기준"]}, {"key": "X2Search", "num": "18", "name": "검색", "sig": ["자동완성"]}, {"key": "X2SearchResult", "num": "19", "name": "검색 결과", "sig": ["정확히 일치"]}, {"key": "X2SearchZero", "num": "20", "name": "검색 0건", "sig": ["못 찾았어요"]}, {"key": "X2Paste", "num": "21", "name": "링크 붙여넣기", "sig": ["복사한 링크에서 제품을 찾았어요"]}, {"key": "X2NotFoundFull", "num": "22", "name": "미등록(완전판)", "sig": ["아직 분석되지 않은 제품이에요"]}, {"key": "X2Contribute", "num": "23", "name": "성분표 촬영", "sig": ["성분표가 프레임 안에"]}, {"key": "X2OcrConfirm", "num": "24", "name": "인식 확인", "sig": ["인식 결과 확인"]}, {"key": "X2ContribDone", "num": "25", "name": "분석 완료", "sig": ["분석 완료!"]}, {"key": "X2MyContrib", "num": "26", "name": "내 기여", "sig": ["도움받은 사람"]}, {"key": "X2HowGrade", "num": "27", "name": "등급 기준 공개", "sig": ["2층으로 계산해요"]}, {"key": "X3Alternative", "num": "28", "name": "더 나은 선택", "sig": ["의 대안이에요"]}, {"key": "X3Compare", "num": "29", "name": "제품 비교", "sig": ["비교 링크 공유하기"]}, {"key": "X3TrayBar", "num": "30", "name": "비교함 바", "sig": ["비교함 2"]}, {"key": "X3History", "num": "31", "name": "스캔 히스토리", "sig": ["기준으로 표시 중"]}, {"key": "X3Saved", "num": "32", "name": "저장한 제품", "sig": ["저장한 제품의 등급이 바뀌면"]}, {"key": "X3Pwa", "num": "33", "name": "PWA 설치 유도", "sig": ["홈 화면에 추가하면"]}, {"key": "X3Alarm", "num": "34", "name": "알림 설정", "sig": ["카카오 채널로 받아요"]}, {"key": "X4Summary", "num": "35", "name": "식품 환경 요약", "sig": ["이번 주에 바꾸면 효과가 큰 제품"]}, {"key": "X4Replace", "num": "36", "name": "교체 계획", "sig": ["바꿔볼게요"]}, {"key": "X4Weekly", "num": "37", "name": "주간 요약", "sig": ["이번 주에 찍은 4개"]}, {"key": "X5My", "num": "38", "name": "마이", "sig": ["둘러보는 중이에요"]}, {"key": "X5Settings", "num": "39", "name": "설정", "sig": ["1.0.0 (웹)"]}, {"key": "X5Login", "num": "40", "name": "로그인", "sig": ["기록을 어디서나"]}], "nav": {"V2Splash": [{"label": "마이뉴티", "to": "V2Consent"}], "V2Consent": [{"label": "확인하고 시작하기", "to": "V2CameraAsk"}, {"label": "개인정보 처리방침 전문 보기", "to": "V2Consent"}], "V2CameraAsk": [{"label": "허용하기", "to": "V2OnbStart"}, {"label": "나중에", "to": "V2Picker"}], "V2OnbStart": [{"label": "찍어보기", "to": "V2OnbScan"}, {"label": "지금 찍을 게 없어요", "to": "V2Picker"}], "V2Picker": [{"label": "더단백 라떼", "to": "V2FirstResult"}, {"label": "프로틴바 카카오", "to": "V2FirstResult"}, {"label": "그릭요거트 플레인", "to": "V2FirstResult"}, {"label": "잇더핏 프로틴", "to": "V2FirstResult"}, {"label": "닭가슴살 스팀", "to": "V2FirstResult"}, {"label": "제로 스파클링", "to": "V2FirstResult"}], "V2OnbScan": [{"label": "셔터 없이 자동으로 인식돼요", "to": "V2FirstResult"}], "V2FirstResult": [{"label": "하나 더 찍어보기", "to": "V2OnbScan"}, {"label": "바로 목표 설정하기", "to": "V2Goal"}, {"label": "성분 상세 · 등급 근거 보기", "to": "V2Detail"}], "V2Goal": [{"label": "이 목표로 계산하기", "to": "V2Recalc"}, {"label": "건너뛰기 — 일반 기준으로 볼게요", "to": "X2Home"}], "V2Recalc": [{"label": "홈으로", "to": "X2Home"}], "V2Scan": [{"label": "연속으로 찍으면 결과가 바로 바뀌어요", "to": "V2Sheet"}, {"label": "직접 검색", "to": "X2Search"}, {"label": "앨범에서 선택", "to": "V2Sheet"}], "V2Sheet": [{"label": "자세히 보기", "to": "FinalResult"}, {"label": "담기", "to": "X3TrayBar"}], "FinalResult": [{"label": "성분 상세 · 등급 근거 보기", "to": "V2Detail"}, {"label": "더 나은 선택 보기", "to": "X3Alternative"}, {"label": "비교함에 담기", "to": "X3Compare"}, {"label": "체중 감량 기준", "to": "V2GoalSettings"}, {"label": "왜 C인가요?", "to": "X2HowGrade"}], "V2Detail": [{"label": "성분 상세", "to": "FinalResult"}], "V2NotFound": [{"label": "확인", "to": "X2Home"}], "V2GoalSettings": [{"label": "저장", "to": "FinalResult"}, {"label": "목표 설정", "to": "X5My"}], "X2Home": [{"label": "최근 스캔", "to": "FinalResult"}, {"label": "단백질 음료 랭킹", "to": "X2Ranking"}, {"label": "지금까지 12개 확인 · 평균 C", "to": "X4Summary"}, {"label": "제품명·브랜드 검색", "to": "X2Search"}, {"label": "복사한 상품 링크 붙여넣기", "to": "X2Paste"}, {"label": "내 기록", "to": "X3History"}, {"label": "마이", "to": "X5My"}], "X2Ranking": [{"label": "잇더핏 프로틴 190ml", "to": "FinalResult"}, {"label": "선정 기준", "to": "X2HowGrade"}, {"label": "카테고리 랭킹", "to": "X2Home"}], "X2Search": [{"label": "더단백 라떼 350ml", "to": "X2SearchResult"}, {"label": "“더단”으로 검색", "to": "X2SearchResult"}], "X2SearchResult": [{"label": "더단백 라떼 350ml", "to": "FinalResult"}], "X2SearchZero": [{"label": "이 제품, 30초 만에 분석해 볼까요?", "to": "X2Contribute"}, {"label": "잇더핏 프로틴 190ml", "to": "FinalResult"}, {"label": "찾는 제품 알려주기 (선택)", "to": "X2SearchZero"}], "X2Paste": [{"label": "이 제품 맞아요", "to": "FinalResult"}, {"label": "아니에요 — 직접 검색", "to": "X2Search"}], "X2NotFoundFull": [{"label": "분석해 보기", "to": "X2Contribute"}, {"label": "나중에", "to": "X2Home"}], "X2Contribute": [{"label": "병·파우치는 살짝 눕혀 찍으면 반사가 줄어요", "to": "X2OcrConfirm"}], "X2OcrConfirm": [{"label": "맞아요 — 분석 완료하기", "to": "X2ContribDone"}, {"label": "다시 찍기", "to": "X2Contribute"}], "X2ContribDone": [{"label": "확인", "to": "X2MyContrib"}], "X2MyContrib": [{"label": "내 기여", "to": "X5My"}], "X2HowGrade": [{"label": "등급은 어떻게 매기나", "to": "FinalResult"}], "X3Alternative": [{"label": "잇더핏 프로틴 190ml", "to": "FinalResult"}, {"label": "더 나은 선택", "to": "FinalResult"}], "X3Compare": [{"label": "잇더핏 자세히 보기", "to": "FinalResult"}, {"label": "비교 링크 공유하기", "to": "X3Compare"}, {"label": "제품 비교", "to": "X3TrayBar"}], "X3TrayBar": [{"label": "비교하기", "to": "X3Compare"}, {"label": "카테고리 랭킹", "to": "X2Home"}], "X3History": [{"label": "더단백 라떼 350ml", "to": "FinalResult"}, {"label": "요약", "to": "X4Summary"}, {"label": "저장", "to": "X3Saved"}], "X3Saved": [{"label": "잇더핏 프로틴 190ml", "to": "FinalResult"}, {"label": "요약", "to": "X4Summary"}, {"label": "기록", "to": "X3History"}], "X3Pwa": [{"label": "홈 화면에 추가", "to": "X2Home"}, {"label": "나중에", "to": "X2Home"}], "X3Alarm": [{"label": "알림 설정", "to": "X5Settings"}], "X4Summary": [{"label": "더단백 라떼 350ml", "to": "X3Alternative"}, {"label": "기록", "to": "X3History"}, {"label": "저장", "to": "X3Saved"}, {"label": "로그인", "to": "X5Login"}], "X4Replace": [{"label": "교체 계획", "to": "X4Summary"}, {"label": "바꿔볼게요", "to": "X3Alternative"}], "X4Weekly": [{"label": "이번 주 바꿔볼 제품 1개", "to": "X3Alternative"}, {"label": "주간 요약", "to": "X4Summary"}], "X5My": [{"label": "내 기여", "to": "X2MyContrib"}, {"label": "등급은 어떻게 매기나", "to": "X2HowGrade"}, {"label": "알림 설정", "to": "X3Alarm"}, {"label": "설정", "to": "X5Settings"}, {"label": "로그인", "to": "X5Login"}, {"label": "홈", "to": "X2Home"}, {"label": "내 기록", "to": "X3History"}], "X5Settings": [{"label": "알림 설정", "to": "X3Alarm"}, {"label": "목표 설정", "to": "V2GoalSettings"}, {"label": "설정", "to": "X5My"}], "X5Login": [{"label": "카카오로 3초 만에 시작", "to": "X5My"}, {"label": "Google로 시작", "to": "X5My"}, {"label": "나중에 할게요", "to": "X5My"}]}};

figma.showUI(__html__, { width: 380, height: 470 });

function textNodes(node) { return node.findAll(function (n) { return n.type === 'TEXT'; }); }
function frameText(f) { return textNodes(f).map(function (t) { return t.characters; }).join('\n'); }
function isScreen(n) {
  return (n.type === 'FRAME' || n.type === 'GROUP' || n.type === 'INSTANCE' || n.type === 'COMPONENT') &&
         Math.abs(n.width - 390) < 6 && Math.abs(n.height - 844) < 6;
}
function clickTarget(textNode, screen) {
  var node = textNode, best = textNode;
  for (var i = 0; i < 4; i++) {
    var p = node.parent;
    if (!p || p.id === screen.id || !('width' in p)) break;
    if (p.width <= screen.width - 8 && p.height <= 92) best = p;
    node = p;
  }
  return best;
}

async function run(opts) {
  var log = [];
  var page = figma.currentPage;
  var all = page.findAll(isScreen);
  if (!all.length) {
    figma.ui.postMessage({ done: true, log: ['화면 프레임(390x844)을 찾지 못했습니다.\n임포트한 페이지를 연 상태에서 실행하세요.'] });
    return;
  }
  var map = {};
  var used = [];
  var cache = all.map(function (f) { return { f: f, txt: frameText(f) }; });
  DATA.screens.forEach(function (s) {
    for (var i = 0; i < s.sig.length; i++) {
      var sig = s.sig[i];
      var hit = null;
      for (var j = 0; j < cache.length; j++) {
        if (cache[j].txt.indexOf(sig) !== -1 && used.indexOf(cache[j].f.id) === -1) { hit = cache[j]; break; }
      }
      if (hit) { map[s.key] = hit.f; used.push(hit.f.id); break; }
    }
  });
  var found = Object.keys(map);
  log.push('화면 인식: ' + found.length + ' / ' + DATA.screens.length);
  var missing = DATA.screens.filter(function (s) { return !map[s.key]; });
  if (missing.length) log.push('미인식: ' + missing.map(function (m) { return m.num + ' ' + m.name; }).join(', '));

  if (opts.rename) {
    DATA.screens.forEach(function (s) { if (map[s.key]) map[s.key].name = s.num + ' ' + s.name; });
    log.push('프레임 이름 정리 완료');
  }

  var wired = 0, skipped = 0;
  for (var fi = 0; fi < found.length; fi++) {
    var key = found[fi];
    var screen = map[key];
    var navs = DATA.nav[key] || [];
    var picked = {};
    for (var ni = 0; ni < navs.length; ni++) {
      var nv = navs[ni];
      var dest = map[nv.to];
      if (!dest) { skipped++; continue; }
      var texts = textNodes(screen);
      var t = null;
      for (var a = 0; a < texts.length; a++) { if (texts[a].characters.trim() === nv.label) { t = texts[a]; break; } }
      if (!t) for (var b = 0; b < texts.length; b++) { if (texts[b].characters.trim().indexOf(nv.label) === 0) { t = texts[b]; break; } }
      if (!t) for (var c = 0; c < texts.length; c++) { if (texts[c].characters.indexOf(nv.label) !== -1) { t = texts[c]; break; } }
      if (!t) { skipped++; continue; }
      var target = clickTarget(t, screen);
      if (!picked[target.id]) picked[target.id] = { node: target, dest: dest };
    }
    var ids = Object.keys(picked);
    for (var pi = 0; pi < ids.length; pi++) {
      var item = picked[ids[pi]];
      try {
        await item.node.setReactionsAsync([{
          trigger: { type: 'ON_CLICK' },
          actions: [{
            type: 'NODE', destinationId: item.dest.id, navigation: 'NAVIGATE',
            transition: { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.25 },
            preserveScrollPosition: false
          }]
        }]);
        wired++;
      } catch (e) { skipped++; }
    }
  }
  if (opts.setStart && map['V2Splash']) {
    try { page.prototypeStartNodeID = map['V2Splash'].id; } catch (e) {}
  }
  log.push('연결 생성: ' + wired + '개' + (skipped ? ' (건너뜀 ' + skipped + ')' : ''));
  log.push('\n피그마 우상단 ▶ 재생 버튼으로 확인하세요.');
  figma.ui.postMessage({ done: true, log: log });
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'run') await run(msg);
  if (msg.type === 'close') figma.closePlugin();
};
