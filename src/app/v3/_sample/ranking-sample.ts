/*
 * 검토용 예시 자료. 서버 응답(DTO)과 같은 모양으로 적어, 실제 응답과 똑같이 API 함수·mapper·훅을 탄다.
 * 배포 서버의 `/rankings` 계열이 제품을 적재하기 전이라 500을 돌려주는 동안 화면을 확인하는 용도다.
 *
 * - 제품 이름·브랜드·점수·단백질 값은 피그마 2-2 화면에 그려진 예시 값이다. 실제 제품의 값이 아니다
 * - 태그는 서버가 주는 말(「단백질 많음」「포화지방 많음」, 최대 2개)로 적었다. 피그마 그림의 태그
 *   (「고단백」「저당」「고포화지방」, 3개까지)와 글·개수가 다르다
 * - 합산 칩(샐러드·닭가슴살처럼 다른 대분류 제품을 모아 보이는 칩)의 코드는 서버 값을 알 수 없어 지어낸 값이다
 * - 사진은 저장소에 이미 있는 예시 그림만 쓴다. 없는 제품은 「사진 없음」 그림이 나온다
 * - 커클랜드(5)·칼만스(3)·미트리(4)는 3-2 제품 결과 예시(`product/[id]/_fixtures.ts`)와 같은 번호라 카드를 누르면
 *   결과 화면이 열린다. 나머지 번호는 결과 예시가 없다
 */
import type {
  CategoryInfoDto,
  CoverageDto,
  ProductCardDto,
  RankingCategoriesDto,
} from "@/lib/ranking/types";

const UPDATED_AT = "2026-10-18T03:00:00";

export type SampleProduct = ProductCardDto & {
  /** 100g당 단백질(g). 「단백질 많은 순」 예시에만 쓴다. 없으면 서버처럼 맨 뒤로 보낸다 */
  proteinPer100g?: number;
};

function product(
  productId: number,
  brandLine: string | null,
  name: string,
  score: number,
  grade: "A" | "B" | "C" | "D" | "E",
  tags: string[],
  extra: { imageUrl?: string; proteinPer100g?: number } = {},
): SampleProduct {
  const label = {
    A: "잘 맞음",
    B: "맞는 편",
    C: "보통",
    D: "안 맞는 편",
    E: "안 맞음",
  }[grade];
  return {
    productId,
    name,
    brandLine,
    imageUrl: extra.imageUrl ?? null,
    state: "ANALYZED",
    stateLabel: "분석 완료",
    // 예시는 두 목표에 같은 점수를 넣었다. 실제 서버는 목표마다 다른 점수를 준다
    goals: [
      { goal: "WEIGHT_LOSS", score, grade, label },
      { goal: "MUSCLE_GAIN", score, grade, label },
    ],
    tags,
    saved: false,
    proteinPer100g: extra.proteinPer100g,
  };
}

const HIGH_PROTEIN = "단백질 많음";
const HIGH_SAT_FAT = "포화지방 많음";

/** 칩 코드 → 점수 높은 순 제품 */
export const SAMPLE_PRODUCTS: Record<string, SampleProduct[]> = {
  "01S4": [
    product(
      9001,
      "마이프로틴",
      "하이프로틴바 초콜렛 오렌지",
      96,
      "A",
      [HIGH_PROTEIN, HIGH_SAT_FAT],
      { imageUrl: "/fixtures/product-2.png", proteinPer100g: 33.3 },
    ),
    product(
      5,
      "커클랜드 시그니처",
      "프로틴바 초콜릿 브라우니",
      92,
      "A",
      [HIGH_PROTEIN, HIGH_SAT_FAT],
      { imageUrl: "/fixtures/product-1.png", proteinPer100g: 35 },
    ),
    product(
      9003,
      "마이프로틴",
      "하이프로틴바",
      87,
      "A",
      [HIGH_PROTEIN, "당류 적음"],
      { proteinPer100g: 32 },
    ),
    product(
      3,
      "칼만스",
      "프로틴바 솔티드 다크초코&아몬드",
      79,
      "A",
      [HIGH_PROTEIN, HIGH_SAT_FAT],
      { imageUrl: "/fixtures/product-3.png", proteinPer100g: 25 },
    ),
    product(
      4,
      "미트리",
      "카카오초코 프로틴바",
      62,
      "C",
      [HIGH_PROTEIN, "칼로리 높음"],
      { imageUrl: "/fixtures/product-4.png", proteinPer100g: 37.7 },
    ),
    product(9006, "오리온", "닥터유단백질바", 41, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9007, "닥터유", "단백질바 미니", 41, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9008, "닥터유", "프로 단백질바 크런치 미니", 40, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9009, "청정원", "프로틴 초코볼&너츠", 37, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9010, "아이즈", "프로틴초코볼", 37, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9011, "씨알푸드", "초콜릿 프로틴바", 37, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
    product(9012, "마이프로틴", "프로틴 초코딥", 35, "E", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
  ],
  "01S1": [
    product(9101, "샐러리아", "오리지널 닭가슴살 포케", 81, "A", [
      HIGH_PROTEIN,
    ]),
  ],
  "01S2": [
    product(9102, "하림", "닭가슴바블랙페퍼80g", 74, "B", [
      HIGH_PROTEIN,
      "나트륨 많음",
    ]),
  ],
  "01S3": [
    product(9103, "풀무원", "건강을 제면한 넓은 두부면", 89, "A", [
      HIGH_PROTEIN,
      "칼로리 낮음",
    ]),
  ],
  "0201": [
    product(9201, "CJ", "비비고닭곰탕500G", 73, "B", [
      "칼로리 낮음",
      "나트륨 많음",
    ]),
  ],
  "0202": [
    product(9202, "CJ", "햇반100%현미밥130G(3입)", 72, "B", [
      "당류 적음",
      "단백질 적음",
    ]),
  ],
  "0203": [
    // 브랜드 줄이 없는 제품(피그마 「샌드위치·버거 1위」 줄)
    product(9203, null, "통새우치즈버거", 54, "D", [
      HIGH_PROTEIN,
      HIGH_SAT_FAT,
    ]),
  ],
};

/** 대분류 15개(백엔드 분류 시드의 코드·이름·순서). 예시에서 순위가 열린 칩은 앞의 두 대분류에만 있다 */
export const SAMPLE_CATEGORIES: RankingCategoriesDto = {
  updatedAt: UPDATED_AT,
  majors: [
    {
      code: "01",
      name: "다이어트·단백질",
      chips: [
        chip("01S1", "샐러드", true),
        chip("01S2", "닭가슴살", true),
        chip("01S3", "두부·곤약", true),
        chip("0101", "단백질 파우더", false),
        chip("01S4", "프로틴바·간식", true),
        chip("01S5", "단백질 음료", true),
      ],
    },
    {
      code: "02",
      name: "간편식",
      chips: [
        chip("0201", "국·탕·찌개", false),
        chip("0202", "즉석밥·덮밥", false),
        chip("0203", "샌드위치·버거", false),
      ],
    },
    { code: "03", name: "음료", chips: [] },
    { code: "04", name: "빵·케이크·잼", chips: [] },
    { code: "05", name: "과자·초콜릿·떡", chips: [] },
    { code: "06", name: "라면·면", chips: [] },
    { code: "07", name: "고기·햄·달걀", chips: [] },
    { code: "08", name: "유제품·아이스크림", chips: [] },
    { code: "09", name: "수산물·건어물", chips: [] },
    { code: "10", name: "쌀·잡곡·견과", chips: [] },
    { code: "11", name: "커피·차", chips: [] },
    { code: "12", name: "양념·소스·기름", chips: [] },
    { code: "13", name: "반찬·김치·두부", chips: [] },
    { code: "14", name: "건강식품", chips: [] },
    { code: "15", name: "과일·채소", chips: [] },
  ],
};

// 개수는 아래 예시 제품 수에서 센다. 프로틴바·간식만 점수 없는 제품이 하나 더 있는 것으로 둬
// 「13개 중 12개 점수 있음」 꼴을 보인다
function chip(code: string, name: string, aggregate: boolean) {
  const analyzed = SAMPLE_PRODUCTS[code]?.length ?? 0;
  const total = code === "01S4" ? analyzed + 1 : analyzed;
  return { code, name, aggregate, total, analyzed, open: true };
}

export function sampleCategoryInfo(code: string): CategoryInfoDto | null {
  for (const major of SAMPLE_CATEGORIES.majors) {
    const found = major.chips.find((c) => c.code === code);
    if (found)
      return {
        code: found.code,
        name: found.name,
        majorCode: major.code,
        majorName: major.name,
      };
  }
  return null;
}

export function sampleCoverage(code: string): CoverageDto {
  const found = SAMPLE_CATEGORIES.majors
    .flatMap((major) => major.chips)
    .find((c) => c.code === code);
  return {
    total: found?.total ?? 0,
    analyzed: found?.analyzed ?? 0,
    updatedAt: UPDATED_AT,
  };
}
