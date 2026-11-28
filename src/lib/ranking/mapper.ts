import type {
  GradeLetter,
  ProductCardDto,
  SortValueDto,
} from "@/lib/product/types";
import type {
  CategoryInfoDto,
  LeaderGroupDto,
  OverviewGroupDto,
  RankedItemDto,
  RankedProduct,
  RankingCategories,
  RankingCategoriesDto,
  RankingCategory,
  RankingDto,
  RankingGoal,
  RankingLeaderGroup,
  RankingLeaders,
  RankingLeadersDto,
  RankingOverview,
  RankingOverviewDto,
  RankingOverviewGroup,
  RankingPage,
  RankingScoreBand,
  RankingTag,
} from "@/lib/ranking/types";

export function toRankingCategories(
  dto: RankingCategoriesDto,
): RankingCategories {
  return {
    majors: dto.majors.map((major) => ({
      code: major.code,
      name: major.name,
      // 서버가 열린 칩만 주지만, 계약이 바뀌어 닫힌 칩이 섞여도 탭으로 그리지 않게 한 번 더 거른다
      chips: major.chips
        .filter((chip) => chip.open)
        .map((chip) => ({ code: chip.code, name: chip.name })),
    })),
    updatedAt: dto.updatedAt ?? null,
  };
}

export function toRankingPage(dto: RankingDto): RankingPage {
  return {
    category: toCategory(dto.category),
    goal: dto.goal,
    sort: dto.sort,
    sortLabel: dto.sortLabel,
    coverage: dto.coverage,
    total: dto.total,
    page: dto.page,
    hasNext: dto.hasNext,
    items: dto.items.map((item) => toRankedProduct(item, dto.goal)),
  };
}

/** 무한 목록의 페이지를 하나로 합친다. 머리 줄 값(개수·정렬·목표)은 첫 페이지, 다음 페이지 여부는 마지막 페이지 것을 쓴다 */
export function mergeRankingPages(pages: RankingPage[]): RankingPage {
  const first = pages[0];
  const last = pages[pages.length - 1];
  return {
    ...first,
    page: last.page,
    hasNext: last.hasNext,
    items: pages.flatMap((page) => page.items),
  };
}

export function toRankingOverview(dto: RankingOverviewDto): RankingOverview {
  return {
    majorCode: dto.majorCode,
    majorName: dto.majorName,
    goal: dto.goal,
    groups: dto.groups.map((group) => toOverviewGroup(group, dto.goal)),
  };
}

export function toRankingLeaders(dto: RankingLeadersDto): RankingLeaders {
  return {
    goal: dto.goal,
    updatedAt: dto.updatedAt ?? null,
    groups: dto.groups.map((group) => toLeaderGroup(group, dto.goal)),
  };
}

function toLeaderGroup(
  dto: LeaderGroupDto,
  goal: RankingGoal,
): RankingLeaderGroup {
  return {
    majorCode: dto.majorCode,
    majorName: dto.majorName,
    items: dto.items.map((item) => ({
      category: toCategory(item.category),
      // 그 중분류의 1위라 서버가 순위를 따로 주지 않는다
      product: toRankedProduct({ rank: 1, product: item.product }, goal),
    })),
  };
}

function toOverviewGroup(
  dto: OverviewGroupDto,
  goal: RankingGoal,
): RankingOverviewGroup {
  return {
    category: toCategory(dto.category),
    coverage: dto.coverage,
    items: dto.items.map((item) => toRankedProduct(item, goal)),
  };
}

function toCategory(dto: CategoryInfoDto): RankingCategory {
  return {
    code: dto.code,
    name: dto.name,
    majorCode: dto.majorCode ?? null,
    majorName: dto.majorName ?? null,
  };
}

function toRankedProduct(dto: RankedItemDto, goal: RankingGoal): RankedProduct {
  const { product } = dto;
  return {
    id: String(product.productId),
    rank: dto.rank,
    name: product.name,
    // 브랜드 줄이 빈 문자열로 와도 「 · 」만 남지 않게 없는 것으로 본다
    brand: product.brandLine?.trim() || null,
    imageUrl: product.imageUrl || null,
    score: toScore(product, goal),
    tags: toTags(product.tags),
    sortText: product.sortValue ? toSortText(product.sortValue) : null,
  };
}

const BAND_BY_GRADE: Record<GradeLetter, RankingScoreBand> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

// 점수 색 구간은 서버가 정한 등급(A~E)을 그대로 따른다. 경계 점수를 화면에서 다시 계산하지 않는다
function toScore(product: ProductCardDto, goal: RankingGoal) {
  const grade = product.goals.find((g) => g.goal === goal);
  if (!grade) return null;
  const band = BAND_BY_GRADE[grade.grade];
  if (band === undefined || !Number.isFinite(grade.score)) return null;
  return { value: grade.score, band };
}

/**
 * 카드 태그. 서버는 짧은 말만 주고 좋은 점인지 아쉬운 점인지 주지 않아(`ProductCard.tags: string[]`), 검색 · 더 맞는
 * 제품과 같게 모두 같은 색으로 둔다(API 플랜 결정 기록 12-6). 말을 거꾸로 읽어 칠하면 서버 문구가 바뀔 때 조용히 틀린다.
 * 서버가 구분을 함께 주면 그때 `warn`을 채운다
 */
function toTags(labels: string[]): RankingTag[] {
  return labels.map((label) => ({ label, warn: false }));
}

const NUTRIENT_LABEL: Partial<Record<string, string>> = {
  CALORIES: "칼로리",
  PROTEIN: "단백질",
  SUGAR: "당류",
};

/**
 * 영양소 정렬일 때 태그 자리의 글. 디자인은 「100g당 단백질 37.7g」 순서이고 서버 `text`는
 * 「단백질 37.7g · 100g당」이라, 디자인 순서로 다시 짓는다. 모르는 영양소면 서버 글을 그대로 쓴다.
 */
export function toSortText(dto: SortValueDto): string {
  const label = NUTRIENT_LABEL[dto.nutrient];
  if (!label || dto.value === null || !Number.isFinite(dto.value))
    return dto.text;
  return `${dto.basis}당 ${label} ${formatAmount(dto.value)}${dto.unit}`;
}

/** 소수 첫째 자리까지, 끝의 0은 뗀다(서버 `ProductCardService.plain`과 같은 규칙) */
function formatAmount(value: number): string {
  return String(Math.round(value * 10) / 10);
}
