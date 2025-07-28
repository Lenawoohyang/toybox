// University Matcher 향상된 타입 정의
// Based on the improvement plan document

export interface University {
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

export interface StudentProfile {
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
    universitySize?: ('small' | 'medium' | 'large')[];
    setting?: ('urban' | 'suburban' | 'rural')[];
    type?: ('public' | 'private')[];
  };
}

export interface LanguageTest {
  type: 'toefl' | 'duolingo' | 'ielts';
  score: number;
}

export interface MatchResult extends University {
  matchScore: number;
  category: 'reach' | 'target' | 'safety';
  reasons: string[];
}

export interface CategorizedMatches {
  reach: MatchResult[];
  target: MatchResult[];
  safety: MatchResult[];
}

export interface FilterCriteria {
  countries?: string[];
  states?: string[];
  tuitionRange?: [number, number];
  rankingRange?: [number, number];
  majors?: string[];
  universityTypes?: ('public' | 'private')[];
  sizes?: ('small' | 'medium' | 'large')[];
  settings?: ('urban' | 'suburban' | 'rural')[];
}

export interface SampleStudent {
  id: string;
  name: string;
  profile: StudentProfile;
  description: string;
}

export interface UniversityDataMeta {
  version: string;
  lastUpdated: string;
  totalUniversities: number;
  sources: string[];
}

export interface UniversityDataset {
  metadata: UniversityDataMeta;
  universities: University[];
}

// TOEFL-Duolingo 변환표 타입
export interface ScoreConversionTable {
  toefl: number;
  duolingo: number;
  description: string;
} 