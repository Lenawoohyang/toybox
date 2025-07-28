import { LanguageTest, ScoreConversionTable } from '../types/university';

// TOEFL ↔ Duolingo 변환표 (계획서 기준)
const CONVERSION_TABLE: ScoreConversionTable[] = [
  { toefl: 60, duolingo: 85, description: "최소 입학 기준" },
  { toefl: 67, duolingo: 90, description: "최소 입학 기준" },
  { toefl: 68, duolingo: 95, description: "일반적 입학 기준" },
  { toefl: 78, duolingo: 100, description: "일반적 입학 기준" },
  { toefl: 79, duolingo: 105, description: "권장 점수" },
  { toefl: 93, duolingo: 110, description: "권장 점수" },
  { toefl: 94, duolingo: 115, description: "경쟁력 있는 점수" },
  { toefl: 101, duolingo: 120, description: "경쟁력 있는 점수" },
  { toefl: 102, duolingo: 125, description: "상위권 대학 기준" },
  { toefl: 109, duolingo: 130, description: "상위권 대학 기준" },
  { toefl: 110, duolingo: 135, description: "최상위권 대학 기준" },
  { toefl: 120, duolingo: 160, description: "최상위권 대학 기준" }
];

export class LanguageTestConverter {
  /**
   * TOEFL 점수를 Duolingo 점수로 변환
   */
  static toeflToDuolingo(toeflScore: number): number {
    if (toeflScore <= 0) return 10;
    if (toeflScore >= 120) return 160;

    // 정확한 매칭이 있는지 확인
    const exactMatch = CONVERSION_TABLE.find(entry => entry.toefl === toeflScore);
    if (exactMatch) return exactMatch.duolingo;

    // 선형 보간법으로 변환
    let lowerBound = CONVERSION_TABLE[0];
    let upperBound = CONVERSION_TABLE[CONVERSION_TABLE.length - 1];

    for (let i = 0; i < CONVERSION_TABLE.length - 1; i++) {
      if (toeflScore >= CONVERSION_TABLE[i].toefl && toeflScore <= CONVERSION_TABLE[i + 1].toefl) {
        lowerBound = CONVERSION_TABLE[i];
        upperBound = CONVERSION_TABLE[i + 1];
        break;
      }
    }

    const ratio = (toeflScore - lowerBound.toefl) / (upperBound.toefl - lowerBound.toefl);
    const duolingoScore = lowerBound.duolingo + ratio * (upperBound.duolingo - lowerBound.duolingo);
    
    return Math.round(duolingoScore);
  }

  /**
   * Duolingo 점수를 TOEFL 점수로 변환
   */
  static duolingoToToefl(duolingoScore: number): number {
    if (duolingoScore <= 10) return 0;
    if (duolingoScore >= 160) return 120;

    // 정확한 매칭이 있는지 확인
    const exactMatch = CONVERSION_TABLE.find(entry => entry.duolingo === duolingoScore);
    if (exactMatch) return exactMatch.toefl;

    // 선형 보간법으로 변환
    let lowerBound = CONVERSION_TABLE[0];
    let upperBound = CONVERSION_TABLE[CONVERSION_TABLE.length - 1];

    for (let i = 0; i < CONVERSION_TABLE.length - 1; i++) {
      if (duolingoScore >= CONVERSION_TABLE[i].duolingo && duolingoScore <= CONVERSION_TABLE[i + 1].duolingo) {
        lowerBound = CONVERSION_TABLE[i];
        upperBound = CONVERSION_TABLE[i + 1];
        break;
      }
    }

    const ratio = (duolingoScore - lowerBound.duolingo) / (upperBound.duolingo - lowerBound.duolingo);
    const toeflScore = lowerBound.toefl + ratio * (upperBound.toefl - lowerBound.toefl);
    
    return Math.round(toeflScore);
  }

  /**
   * 언어 테스트 점수를 0-1 사이로 정규화
   */
  static normalizeScore(test: LanguageTest): number {
    switch (test.type) {
      case 'toefl':
        return Math.min(1, Math.max(0, test.score / 120));
      case 'duolingo':
        return Math.min(1, Math.max(0, (test.score - 10) / 150)); // 10-160 범위
      case 'ielts':
        return Math.min(1, Math.max(0, test.score / 9));
      default:
        return 0;
    }
  }

  /**
   * 두 언어 테스트 점수를 동일한 기준으로 비교
   */
  static compareScores(test1: LanguageTest, test2: LanguageTest): number {
    const normalized1 = this.normalizeScore(test1);
    const normalized2 = this.normalizeScore(test2);
    return normalized1 - normalized2;
  }

  /**
   * 언어 테스트를 TOEFL 기준으로 통일
   */
  static convertToToefl(test: LanguageTest): number {
    switch (test.type) {
      case 'toefl':
        return test.score;
      case 'duolingo':
        return this.duolingoToToefl(test.score);
      case 'ielts':
        // IELTS -> TOEFL 대략적 변환 (추후 정밀화 가능)
        return Math.round(test.score * 12);
      default:
        return 0;
    }
  }

  /**
   * 언어 테스트를 Duolingo 기준으로 통일
   */
  static convertToDuolingo(test: LanguageTest): number {
    switch (test.type) {
      case 'duolingo':
        return test.score;
      case 'toefl':
        return this.toeflToDuolingo(test.score);
      case 'ielts':
        // IELTS -> Duolingo (TOEFL 경유)
        const toeflEquivalent = Math.round(test.score * 12);
        return this.toeflToDuolingo(toeflEquivalent);
      default:
        return 10;
    }
  }

  /**
   * 점수 범위 검증
   */
  static isValidScore(test: LanguageTest): boolean {
    switch (test.type) {
      case 'toefl':
        return test.score >= 0 && test.score <= 120;
      case 'duolingo':
        return test.score >= 10 && test.score <= 160;
      case 'ielts':
        return test.score >= 0 && test.score <= 9;
      default:
        return false;
    }
  }

  /**
   * 변환표 가져오기
   */
  static getConversionTable(): ScoreConversionTable[] {
    return [...CONVERSION_TABLE];
  }

  /**
   * 특정 점수에 대한 설명 가져오기
   */
  static getScoreDescription(test: LanguageTest): string {
    const toeflScore = this.convertToToefl(test);
    
    for (const entry of CONVERSION_TABLE) {
      if (toeflScore >= entry.toefl - 2 && toeflScore <= entry.toefl + 2) {
        return entry.description;
      }
    }
    
    if (toeflScore < 60) return "입학 기준 미달";
    if (toeflScore >= 110) return "최상위권 대학 기준";
    return "중간 수준";
  }
} 