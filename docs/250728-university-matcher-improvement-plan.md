# University Matcher 개선 계획서
**작성일:** 2025년 1월 28일  
**프로젝트:** toybox-template/src/artifacts/university-matcher

## 📋 목차
1. [현재 상태 분석](#1-현재-상태-분석)
2. [개선 목표](#2-개선-목표)
3. [데이터셋 수집 계획](#3-데이터셋-수집-계획)
4. [기술적 구현 방안](#4-기술적-구현-방안)
5. [구현 단계별 계획](#5-구현-단계별-계획)
6. [예상 구조 변경사항](#6-예상-구조-변경사항)
7. [위험 요소 및 대응방안](#7-위험-요소-및-대응방안)

---

## 1. 현재 상태 분석

### 1.1 기존 University Matcher 현황
- **파일 구조:**
  - `index.tsx` (590줄): 메인 컴포넌트
  - `universities.json` (189줄): 11개 대학 데이터
  - `majors.json` (22줄): 20개 전공 목록
  - `sample-students.json` (35줄): 3명의 샘플 학생

### 1.2 현재 기능
- **점수 기반 매칭:** GPA, TOEFL, SAT 점수로 대학 추천
- **매칭 카테고리:** Reach, Target, Safety로 분류
- **샘플 학생:** 3가지 성적 수준별 예시 제공
- **결과 다운로드:** Markdown 형식 보고서 생성

### 1.3 현재 한계점
1. **제한된 데이터셋:** 11개 대학만 포함 (주로 미국/영국 최상위권)
2. **단일 언어 테스트:** TOEFL만 지원, Duolingo 미지원
3. **고정된 데이터:** 하드코딩된 대학 정보, 동적 업데이트 불가
4. **제한된 필터링:** 국가, 학비, 전공별 세부 필터링 부족
5. **단순한 매칭 알고리즘:** 기본적인 점수 비교만 수행

---

## 2. 개선 목표

### 2.1 주요 개선사항
1. **데이터셋 확장:** US News 2025 기준 Top 200 대학 데이터 수집
2. **다양한 언어 테스트 지원:** Duolingo English Test 추가
3. **유연한 데이터 구조:** 다양한 데이터소스 활용 가능한 구조
4. **향상된 매칭 알고리즘:** 더 정교한 추천 시스템
5. **개선된 사용자 경험:** 필터링, 검색, 정렬 기능 강화

### 2.2 구체적 목표
- **대학 데이터:** 200개 이상 대학 (미국 중심, 일부 글로벌)
- **언어 테스트:** TOEFL + Duolingo 지원
- **필터링:** 국가, 주, 학비 범위, 전공, 대학 유형별
- **성능:** 빠른 검색 및 필터링 (< 200ms)
- **확장성:** 새로운 데이터소스 쉽게 추가 가능

---

## 3. 데이터셋 수집 계획

### 3.1 US News 2025 Top 200 대학 목록

#### 3.1.1 데이터 소스
- **주요 소스:** US News Best Colleges 2025 랭킹
- **보조 소스:** 
  - 각 대학 공식 웹사이트
  - College Board 데이터
  - Peterson's 가이드
  - Niche.com 정보

#### 3.1.2 수집할 데이터 필드
```typescript
interface University {
  // 기본 정보
  id: string;
  name: string;
  shortName?: string;
  
  // 위치 정보
  country: string;
  state?: string;
  city: string;
  location: string; // "City, State" format
  
  // 랭킹 정보
  ranking: {
    usNews2025: number;
    global?: number;
    regional?: number;
  };
  
  // 재정 정보
  tuition: {
    inState?: number;     // 주내 학생 (공립대학)
    outOfState: number;   // 주외/국제 학생
    currency: "USD";
  };
  
  // 입학 정보
  admissions: {
    acceptanceRate: number;
    totalApplications?: number;
    enrolled?: number;
  };
  
  // 언어 요구사항
  languageRequirements: {
    toefl: {
      minimum: number;
      recommended?: number;
    };
    duolingo: {
      minimum: number;
      recommended?: number;
    };
    ielts?: {
      minimum: number;
      recommended?: number;
    };
  };
  
  // 학업 요구사항
  academicRequirements: {
    gpa: {
      minimum: number;
      average?: number;
      scale: "4.0";
    };
    sat: {
      minimum: number;
      average?: number;
      range?: [number, number]; // [25th percentile, 75th percentile]
    };
    act?: {
      minimum: number;
      average?: number;
      range?: [number, number];
    };
  };
  
  // 학교 특성
  characteristics: {
    type: "public" | "private";
    size: "small" | "medium" | "large"; // < 5000, 5000-15000, > 15000
    setting: "urban" | "suburban" | "rural";
    enrollment?: number;
  };
  
  // 강점 전공
  strongMajors: string[];
  
  // 추가 정보
  description: string;
  website?: string;
  
  // 메타데이터
  lastUpdated: string; // ISO date
  dataSource: string[];
}
```

#### 3.1.3 TOEFL ↔ Duolingo 변환표
웹 검색 결과를 바탕으로 한 변환표:

| TOEFL iBT | Duolingo | 비고 |
|-----------|----------|------|
| 60-67 | 85-90 | 최소 입학 기준 |
| 68-78 | 95-100 | 일반적 입학 기준 |
| 79-93 | 105-110 | 권장 점수 |
| 94-101 | 115-120 | 경쟁력 있는 점수 |
| 102-109 | 125-130 | 상위권 대학 기준 |
| 110-120 | 135-160 | 최상위권 대학 기준 |

### 3.2 데이터 수집 방법론 (개발 시점 작업)

> **중요:** 모든 데이터 수집은 개발 시점에 수행되며, 결과는 정적 JSON 파일로 저장됩니다. 
> 런타임에는 서버나 외부 API 호출이 전혀 없습니다.

#### 3.2.1 1차 수집 (개발 시점)
1. **US News 2025 랭킹 리스트 확보**
2. **각 대학별 기본 정보 수집:**
   - 공식 웹사이트에서 입학 요구사항
   - 학비 정보
   - 위치 및 특성 정보

#### 3.2.2 2차 검증 및 보완 (개발 시점)
1. **데이터 일관성 검증**
2. **누락 정보 보완**
3. **TOEFL 점수를 Duolingo로 변환**

#### 3.2.3 정적 데이터 구조화
```typescript
// universities-2025.json 구조 예시
{
  "metadata": {
    "version": "2025.1",
    "lastUpdated": "2025-01-28",
    "totalUniversities": 200,
    "sources": [
      "US News Best Colleges 2025",
      "Official University Websites",
      "College Board"
    ]
  },
  "universities": [
    // University 객체 배열
  ]
}
```

---

## 4. 기술적 구현 방안

> **아키텍처 특성:** 완전한 클라이언트 사이드 애플리케이션
> - 모든 데이터는 정적 JSON 파일로 번들에 포함
> - 서버, 데이터베이스, 외부 API 의존성 없음
> - 브라우저에서만 실행되는 React 컴포넌트

### 4.1 코드 아키텍처 개선

#### 4.1.1 데이터 레이어 분리
```typescript
// types/university.ts - 타입 정의
export interface University { /* 위에 정의된 구조 */ }
export interface StudentProfile { /* 기존 + Duolingo */ }
export interface LanguageTest {
  type: 'toefl' | 'duolingo' | 'ielts';
  score: number;
}

// data/universities-loader.ts - 정적 데이터 로딩
export class UniversityDataLoader {
  // 정적 JSON 파일에서 데이터 로드 (서버 호출 없음)
  static loadUniversities(): University[]
  static loadByCountry(country: string): University[]
  static loadByRanking(min: number, max: number): University[]
}

// services/matching-service.ts - 매칭 로직
export class MatchingService {
  calculateMatch(student: StudentProfile, university: University): MatchResult
  categorizeUniversities(matches: MatchResult[]): CategorizedMatches
}
```

#### 4.1.2 언어 테스트 변환 시스템
```typescript
// services/language-converter.ts
export class LanguageTestConverter {
  static toeflToDuolingo(toeflScore: number): number
  static duolingoToToefl(duolingoScore: number): number
  static normalizeScore(test: LanguageTest): number // 0-1 사이로 정규화
}
```

#### 4.1.3 필터링 시스템
```typescript
// services/filter-service.ts
export interface FilterCriteria {
  countries?: string[];
  states?: string[];
  tuitionRange?: [number, number];
  rankingRange?: [number, number];
  majors?: string[];
  universityTypes?: ('public' | 'private')[];
  sizes?: ('small' | 'medium' | 'large')[];
}

export class FilterService {
  applyFilters(universities: University[], criteria: FilterCriteria): University[]
}
```

### 4.2 컴포넌트 구조 개선

#### 4.2.1 새로운 컴포넌트 구조
```
university-matcher/
├── index.tsx                 # 메인 컴포넌트 (간소화)
├── components/
│   ├── StudentProfileForm.tsx    # 학생 프로필 입력
│   ├── LanguageTestSelector.tsx  # TOEFL/Duolingo 선택
│   ├── FilterPanel.tsx           # 필터링 패널
│   ├── UniversityCard.tsx        # 대학 카드 (기존)
│   ├── MatchingResults.tsx       # 결과 표시
│   └── StatisticsSummary.tsx     # 통계 요약
├── data/
│   ├── universities-2025.json   # 새로운 대학 데이터
│   ├── majors.json              # 확장된 전공 목록
│   └── sample-students.json     # 업데이트된 샘플
├── services/
│   ├── matching-service.ts      # 매칭 로직
│   ├── filter-service.ts        # 필터링 로직
│   └── language-converter.ts    # 언어 테스트 변환
└── types/
    └── university.ts            # 타입 정의
```

#### 4.2.2 언어 테스트 선택 UI
```typescript
// LanguageTestSelector 컴포넌트
const LanguageTestSelector: React.FC = () => {
  const [testType, setTestType] = useState<'toefl' | 'duolingo'>('toefl');
  const [score, setScore] = useState<number>(0);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button 
          variant={testType === 'toefl' ? 'default' : 'outline'}
          onClick={() => setTestType('toefl')}
        >
          TOEFL (0-120)
        </Button>
        <Button 
          variant={testType === 'duolingo' ? 'default' : 'outline'}
          onClick={() => setTestType('duolingo')}
        >
          Duolingo (10-160)
        </Button>
      </div>
      
      <Input
        type="number"
        min={testType === 'toefl' ? 0 : 10}
        max={testType === 'toefl' ? 120 : 160}
        value={score}
        onChange={(e) => setScore(parseInt(e.target.value))}
        placeholder={`Enter your ${testType.toUpperCase()} score`}
      />
      
      {/* 점수 변환 정보 표시 */}
      {score > 0 && (
        <div className="text-sm text-gray-600">
          Equivalent: {testType === 'toefl' 
            ? `Duolingo ${LanguageTestConverter.toeflToDuolingo(score)}`
            : `TOEFL ${LanguageTestConverter.duolingoToToefl(score)}`
          }
        </div>
      )}
    </div>
  );
};
```

### 4.3 매칭 알고리즘 개선

#### 4.3.1 가중치 기반 점수 계산
```typescript
interface MatchingWeights {
  gpa: number;          // 40%
  languageTest: number; // 25%
  sat: number;          // 25%
  majorMatch: number;   // 10%
}

class ImprovedMatchingService {
  private weights: MatchingWeights = {
    gpa: 0.4,
    languageTest: 0.25,
    sat: 0.25,
    majorMatch: 0.1
  };

  calculateMatch(student: StudentProfile, university: University): MatchResult {
    let totalScore = 0;
    const reasons: string[] = [];

    // GPA 점수 계산
    const gpaScore = this.calculateGPAScore(student.gpa, university.academicRequirements.gpa);
    totalScore += gpaScore * this.weights.gpa;

    // 언어 테스트 점수 계산 (TOEFL 또는 Duolingo)
    const languageScore = this.calculateLanguageScore(student, university);
    totalScore += languageScore * this.weights.languageTest;

    // SAT 점수 계산
    const satScore = this.calculateSATScore(student.sat, university.academicRequirements.sat);
    totalScore += satScore * this.weights.sat;

    // 전공 매칭
    const majorScore = university.strongMajors.includes(student.major) ? 100 : 0;
    totalScore += majorScore * this.weights.majorMatch;

    return {
      ...university,
      matchScore: Math.round(totalScore),
      category: this.categorizeMatch(totalScore, university.admissions.acceptanceRate),
      reasons
    };
  }

  private calculateLanguageScore(student: StudentProfile, university: University): number {
    let studentScore: number;
    let requiredScore: number;

    if (student.languageTest.type === 'toefl') {
      studentScore = student.languageTest.score;
      requiredScore = university.languageRequirements.toefl.minimum;
    } else {
      studentScore = student.languageTest.score;
      requiredScore = university.languageRequirements.duolingo.minimum;
    }

    const ratio = studentScore / requiredScore;
    return Math.min(100, ratio * 100);
  }
}
```

---

## 5. 구현 우선순위 및 순서

### 5.1 핵심 기반 작업 (최우선)
1. **타입 정의 및 데이터 구조 설계**
   - 새로운 University 인터페이스 정의
   - StudentProfile 확장 (언어 테스트 타입 추가)
   - TOEFL-Duolingo 변환표 구현

2. **US News 2025 Top 200 대학 데이터 수집 (개발 시점)**
   - 대학 목록 및 상세 정보 수집
   - 정적 JSON 파일로 구조화
   - 데이터 검증 및 최적화

3. **정적 데이터 로딩 서비스 구현**
   - UniversityDataLoader 클래스 구현 (JSON import 기반)
   - 클라이언트 사이드 필터링 및 검색 로직

### 5.2 핵심 기능 개발 (우선순위 높음)
1. **언어 테스트 변환 시스템**
   - LanguageTestConverter 서비스 구현
   - 점수 정규화 로직 개발

2. **개선된 매칭 알고리즘**
   - 가중치 기반 점수 계산 시스템
   - TOEFL/Duolingo 유연한 처리

3. **언어 테스트 선택 UI**
   - LanguageTestSelector 컴포넌트 구현
   - 실시간 점수 변환 표시

### 5.3 UI/UX 개선 (우선순위 중간)
1. **컴포넌트 구조 리팩토링**
   - 기존 index.tsx를 모듈화
   - StudentProfileForm, FilterPanel 등 분리

2. **필터링 시스템**
   - FilterService 구현
   - 국가, 학비, 전공별 필터링 UI

3. **결과 표시 개선**
   - 새로운 대학 정보 포맷에 맞는 UniversityCard 업데이트
   - 통계 요약 기능 추가

### 5.4 고급 기능 (우선순위 낮음)
1. **검색 및 정렬**
   - 대학명 검색 기능
   - 랭킹, 학비, 매칭 점수별 정렬

2. **클라이언트 사이드 성능 최적화**
   - 대용량 정적 데이터 처리 최적화
   - React 메모화 및 로컬 캐싱 적용

3. **사용자 경험 향상**
   - 로딩 상태 개선
   - 에러 처리 강화
   - 반응형 디자인 최적화

---

## 6. 예상 구조 변경사항

### 6.1 파일 구조 변화
```
# 기존 구조
university-matcher/
├── index.tsx
├── universities.json (11개 대학)
├── majors.json
└── sample-students.json

# 새로운 구조
university-matcher/
├── index.tsx (메인 컨테이너)
├── components/
│   ├── StudentProfileForm.tsx
│   ├── LanguageTestSelector.tsx
│   ├── FilterPanel.tsx
│   ├── UniversityCard.tsx
│   ├── MatchingResults.tsx
│   └── StatisticsSummary.tsx
├── data/
│   ├── universities-2025.json (200개 대학)
│   ├── majors-extended.json
│   └── sample-students-updated.json
├── services/
│   ├── matching-service.ts
│   ├── filter-service.ts
│   └── language-converter.ts
├── types/
│   └── university.ts
└── utils/
    ├── data-loader.ts
    └── constants.ts
```

### 6.2 StudentProfile 타입 확장
```typescript
// 기존
interface StudentProfile {
  gpa: number;
  toefl: number;
  sat: number;
  major: string;
}

// 새로운 구조
interface StudentProfile {
  gpa: number;
  languageTest: {
    type: 'toefl' | 'duolingo';
    score: number;
  };
  sat: number;
  major: string;
  
  // 추가 필터링 옵션
  preferences?: {
    countries?: string[];
    maxTuition?: number;
    universitySize?: 'small' | 'medium' | 'large';
    setting?: 'urban' | 'suburban' | 'rural';
  };
}
```

---

## 7. 위험 요소 및 대응방안

### 7.1 데이터 수집 관련 위험
**위험:** 대학별 정확한 입학 요구사항 데이터 확보 어려움
**대응방안:**
- 여러 신뢰할 수 있는 소스 활용
- 데이터 불확실성 표시 (예: "Estimated" 라벨)
- 정기적인 데이터 업데이트 프로세스 구축

### 7.2 클라이언트 사이드 성능 관련 위험
**위험:** 200개 대학 정적 데이터로 인한 브라우저 성능 저하
**대응방안:**
- React.memo 및 useMemo를 통한 렌더링 최적화
- 필터링 결과 로컬 캐싱
- Virtual scrolling으로 DOM 노드 수 제한
- JSON 데이터 압축 및 번들 크기 최적화

### 7.3 사용자 경험 관련 위험
**위험:** 복잡한 UI로 인한 사용성 저하
**대응방안:**
- 단계별 UI 공개 (Progressive disclosure)
- 기본값 및 추천 설정 제공
- 명확한 안내 및 도움말 포함

### 7.4 유지보수 관련 위험
**위험:** 데이터 업데이트 및 유지보수 부담
**대응방안:**
- 모듈화된 구조로 개발
- 자동화된 데이터 검증 도구 개발
- 명확한 문서화 및 코드 주석

---

## 8. 성공 지표

### 8.1 정량적 지표
- **데이터 커버리지:** US News Top 200 대학 100% 포함
- **정확도:** 언어 테스트 변환 오차 ±5% 이내
- **성능:** 초기 로딩 시간 < 3초, 필터링 응답 시간 < 200ms
- **사용성:** 매칭 결과 생성까지 클릭 수 < 5회

### 8.2 정성적 지표
- **사용자 만족도:** 직관적이고 이해하기 쉬운 인터페이스
- **결과 신뢰성:** 현실적이고 도움이 되는 매칭 결과
- **확장성:** 새로운 데이터 소스 쉽게 추가 가능
- **유지보수성:** 코드 가독성 및 모듈화 수준

---

## 9. 결론

이 개선 계획을 통해 University Matcher는 단순한 점수 매칭 도구에서 종합적인 대학 추천 시스템으로 발전할 것입니다. 

### 🎯 **핵심 장점:**
- **Artifact 플랫폼 최적화:** 완전한 클라이언트 사이드 앱으로 서버 없이 실행
- **확장된 데이터:** US News 2025 Top 200 대학 정보로 실용성 대폭 향상
- **다양한 언어 테스트:** TOEFL + Duolingo 지원으로 접근성 개선
- **정적 데이터 구조:** 빠른 로딩과 오프라인 호환성

### 🚀 **기술적 특성:**
- 모든 로직이 브라우저에서 실행
- 정적 JSON 데이터로 빠른 성능
- 외부 의존성 없는 독립적 운영

**다음 단계:** 우선순위에 따라 핵심 기반 작업부터 시작하겠습니다. 