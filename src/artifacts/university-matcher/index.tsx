import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, School, MapPin, DollarSign, Users, Trophy } from 'lucide-react';

// Import data from JSON files
import universitiesData from './universities.json';
import majorsData from './majors.json';
import sampleStudentsData from './sample-students.json';

export const metadata = {
  title: "University Matcher",
  description: "AI-powered university recommendation tool for international students based on GPA, TOEFL, SAT scores and intended major",
  type: "react" as const,
  tags: ["education", "university", "college", "admissions", "international", "consulting"],
  date: "2025-01-27"
};

interface University {
  id: string;
  name: string;
  country: string;
  location: string;
  ranking: number;
  tuitionUSD: number;
  acceptanceRate: number;
  requirements: {
    minGPA: number;
    minTOEFL: number;
    minSAT: number;
  };
  strongMajors: string[];
  description: string;
  type: 'public' | 'private';
}

interface StudentProfile {
  gpa: number;
  toefl: number;
  sat: number;
  major: string;
}

interface MatchResult extends University {
  matchScore: number;
  category: 'reach' | 'target' | 'safety';
  reasons: string[];
}

interface SampleStudent {
  id: string;
  name: string;
  profile: StudentProfile;
  description: string;
}

// Use imported data with proper type assertions
const UNIVERSITIES: University[] = universitiesData as University[];
const MAJORS: string[] = majorsData;
const SAMPLE_STUDENTS: SampleStudent[] = sampleStudentsData as SampleStudent[];

const UniversityMatcher: React.FC = () => {
  const [profile, setProfile] = useState<Partial<StudentProfile>>({});
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateProfile = useCallback((profile: Partial<StudentProfile>): string[] => {
    const errors: string[] = [];
    
    if (!profile.gpa || profile.gpa < 0 || profile.gpa > 4.0) {
      errors.push('GPA must be between 0.0 and 4.0');
    }
    
    if (!profile.toefl || profile.toefl < 0 || profile.toefl > 120) {
      errors.push('TOEFL score must be between 0 and 120');
    }
    
    if (!profile.sat || profile.sat < 400 || profile.sat > 1600) {
      errors.push('SAT score must be between 400 and 1600');
    }
    
    if (!profile.major) {
      errors.push('Please select your intended major');
    }
    
    return errors;
  }, []);

  const calculateMatchScore = useCallback((university: University, student: StudentProfile): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];
    
    // GPA Score (40%)
    const gpaRatio = student.gpa / university.requirements.minGPA;
    if (gpaRatio >= 1.0) {
      score += 40;
      if (gpaRatio >= 1.1) reasons.push(`Strong GPA (${student.gpa.toFixed(2)} vs required ${university.requirements.minGPA})`);
    } else {
      score += Math.max(0, 40 * gpaRatio);
      if (gpaRatio < 0.95) reasons.push(`GPA below requirement (${student.gpa.toFixed(2)} vs required ${university.requirements.minGPA})`);
    }
    
    // TOEFL Score (25%)
    const toeflRatio = student.toefl / university.requirements.minTOEFL;
    if (toeflRatio >= 1.0) {
      score += 25;
      if (toeflRatio >= 1.1) reasons.push(`Strong TOEFL score (${student.toefl} vs required ${university.requirements.minTOEFL})`);
    } else {
      score += Math.max(0, 25 * toeflRatio);
      if (toeflRatio < 0.95) reasons.push(`TOEFL below requirement (${student.toefl} vs required ${university.requirements.minTOEFL})`);
    }
    
    // SAT Score (25%)
    const satRatio = student.sat / university.requirements.minSAT;
    if (satRatio >= 1.0) {
      score += 25;
      if (satRatio >= 1.05) reasons.push(`Strong SAT score (${student.sat} vs required ${university.requirements.minSAT})`);
    } else {
      score += Math.max(0, 25 * satRatio);
      if (satRatio < 0.95) reasons.push(`SAT below requirement (${student.sat} vs required ${university.requirements.minSAT})`);
    }
    
    // Major Match (10%)
    if (university.strongMajors.includes(student.major)) {
      score += 10;
      reasons.push(`Strong program in ${student.major}`);
    }
    
    return { score: Math.min(100, Math.round(score)), reasons };
  }, []);

  const categorizeMatch = useCallback((score: number, acceptanceRate: number): 'reach' | 'target' | 'safety' => {
    if (score >= 85 && acceptanceRate > 15) return 'safety';
    if (score >= 70 && score < 85) return 'target';
    return 'reach';
  }, []);

  const calculateMatches = useCallback(() => {
    const validationErrors = validateProfile(profile);
    setErrors(validationErrors);
    
    if (validationErrors.length > 0) {
      return;
    }
    
    const student = profile as StudentProfile;
    const matches: MatchResult[] = UNIVERSITIES.map(university => {
      const { score, reasons } = calculateMatchScore(university, student);
      const category = categorizeMatch(score, university.acceptanceRate);
      
      return {
        ...university,
        matchScore: score,
        category,
        reasons
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
    
    setResults(matches);
    setIsCalculated(true);
  }, [profile, validateProfile, calculateMatchScore, categorizeMatch]);

  const generateMarkdownReport = useCallback(() => {
    if (!isCalculated || results.length === 0) return;
    
    const student = profile as StudentProfile;
    const date = new Date().toLocaleDateString();
    
    let markdown = `# University Matching Report\n\n`;
    markdown += `**Generated on:** ${date}\n\n`;
    markdown += `## Student Profile\n\n`;
    markdown += `- **GPA:** ${student.gpa.toFixed(2)}/4.0\n`;
    markdown += `- **TOEFL:** ${student.toefl}/120\n`;
    markdown += `- **SAT:** ${student.sat}/1600\n`;
    markdown += `- **Intended Major:** ${student.major}\n\n`;
    
    const categories = ['safety', 'target', 'reach'] as const;
    const categoryNames = { safety: 'Safety Schools', target: 'Target Schools', reach: 'Reach Schools' };
    
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      if (categoryResults.length === 0) return;
      
      markdown += `## ${categoryNames[category]}\n\n`;
      
      categoryResults.forEach((result, index) => {
        markdown += `### ${index + 1}. ${result.name}\n\n`;
        markdown += `- **Location:** ${result.location}, ${result.country}\n`;
        markdown += `- **World Ranking:** #${result.ranking}\n`;
        markdown += `- **Match Score:** ${result.matchScore}%\n`;
        markdown += `- **Acceptance Rate:** ${result.acceptanceRate}%\n`;
        markdown += `- **Annual Tuition:** $${result.tuitionUSD.toLocaleString()}\n`;
        markdown += `- **Type:** ${result.type === 'private' ? 'Private' : 'Public'}\n\n`;
        
        markdown += `**Requirements:**\n`;
        markdown += `- Minimum GPA: ${result.requirements.minGPA}\n`;
        markdown += `- Minimum TOEFL: ${result.requirements.minTOEFL}\n`;
        markdown += `- Minimum SAT: ${result.requirements.minSAT}\n\n`;
        
        markdown += `**Strong Majors:** ${result.strongMajors.join(', ')}\n\n`;
        
        if (result.reasons.length > 0) {
          markdown += `**Match Analysis:**\n`;
          result.reasons.forEach(reason => {
            markdown += `- ${reason}\n`;
          });
          markdown += `\n`;
        }
        
        markdown += `**Description:** ${result.description}\n\n`;
        markdown += `---\n\n`;
      });
    });
    
    markdown += `## Summary\n\n`;
    markdown += `This report shows ${results.length} universities ranked by compatibility with your profile. `;
    markdown += `Focus on applying to a balanced mix of reach, target, and safety schools.\n\n`;
    markdown += `**Legend:**\n`;
    markdown += `- **Reach Schools:** Competitive admits (apply to 2-4)\n`;
    markdown += `- **Target Schools:** Good fit schools (apply to 4-6)\n`;
    markdown += `- **Safety Schools:** Likely admits (apply to 2-3)\n\n`;
    markdown += `*This report is generated for reference only. Please consult with education counselors for personalized advice.*`;
    
    return markdown;
  }, [results, isCalculated, profile]);

  const downloadMarkdown = useCallback(() => {
    const markdown = generateMarkdownReport();
    if (!markdown) return;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `university-matches-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateMarkdownReport]);

  const resetForm = useCallback(() => {
    setProfile({});
    setResults([]);
    setIsCalculated(false);
    setErrors([]);
  }, []);

  const loadSampleStudent = useCallback((sampleId: string) => {
    const sample = SAMPLE_STUDENTS.find(s => s.id === sampleId);
    if (sample) {
      setProfile(sample.profile);
      setErrors([]);
      setResults([]);
      setIsCalculated(false);
    }
  }, []);

  const summary = useMemo(() => {
    if (!isCalculated) return null;
    
    const reach = results.filter(r => r.category === 'reach').length;
    const target = results.filter(r => r.category === 'target').length;
    const safety = results.filter(r => r.category === 'safety').length;
    
    return { reach, target, safety };
  }, [results, isCalculated]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <School className="h-8 w-8 text-blue-600" />
          University Matcher
        </h1>
        <p className="text-gray-600">
          Find the perfect universities based on your academic profile
        </p>
      </div>

      {!isCalculated ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Academic Profile</CardTitle>
            <CardDescription>
              Provide your academic information to get personalized university recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample Student Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Quick Test with Sample Students</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {SAMPLE_STUDENTS.map((sample) => (
                  <Button
                    key={sample.id}
                    variant="outline"
                    size="sm"
                    className="p-3 h-auto text-left"
                    onClick={() => loadSampleStudent(sample.id)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{sample.name}</div>
                      <div className="text-xs text-gray-500">{sample.description}</div>
                      <div className="text-xs font-mono text-blue-600">
                        GPA: {sample.profile.gpa} | TOEFL: {sample.profile.toefl} | SAT: {sample.profile.sat}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-700">Or Enter Your Own Information</Label>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (4.0 scale)</Label>
                <Input
                  id="gpa"
                  type="number"
                  min="0"
                  max="4.0"
                  step="0.01"
                  placeholder="3.75"
                  value={profile.gpa || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, gpa: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toefl">TOEFL Score</Label>
                <Input
                  id="toefl"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="100"
                  value={profile.toefl || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, toefl: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sat">SAT Score</Label>
                <Input
                  id="sat"
                  type="number"
                  min="400"
                  max="1600"
                  placeholder="1350"
                  value={profile.sat || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, sat: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">Intended Major</Label>
                <Select value={profile.major || ''} onValueChange={(value) => setProfile(prev => ({ ...prev, major: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJORS.map(major => (
                      <SelectItem key={major} value={major}>{major}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={calculateMatches} className="flex-1">
                Find My Universities
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Match Results
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    New Search
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Found {results.length} universities • 
                {summary && ` ${summary.reach} reach • ${summary.target} target • ${summary.safety} safety`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Trophy className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{summary?.reach}</div>
                  <div className="text-sm text-red-700">Reach Schools</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{summary?.target}</div>
                  <div className="text-sm text-yellow-700">Target Schools</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <School className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{summary?.safety}</div>
                  <div className="text-sm text-green-700">Safety Schools</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({results.length})</TabsTrigger>
              <TabsTrigger value="reach">Reach ({summary?.reach})</TabsTrigger>
              <TabsTrigger value="target">Target ({summary?.target})</TabsTrigger>
              <TabsTrigger value="safety">Safety ({summary?.safety})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {results.map((result, index) => (
                <UniversityCard key={result.id} result={result} rank={index + 1} />
              ))}
            </TabsContent>

            <TabsContent value="reach" className="space-y-4">
              {results.filter(r => r.category === 'reach').map((result, index) => (
                <UniversityCard key={result.id} result={result} rank={index + 1} />
              ))}
            </TabsContent>

            <TabsContent value="target" className="space-y-4">
              {results.filter(r => r.category === 'target').map((result, index) => (
                <UniversityCard key={result.id} result={result} rank={index + 1} />
              ))}
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              {results.filter(r => r.category === 'safety').map((result, index) => (
                <UniversityCard key={result.id} result={result} rank={index + 1} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

interface UniversityCardProps {
  result: MatchResult;
  rank: number;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ result, rank }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reach': return 'destructive';
      case 'target': return 'default';
      case 'safety': return 'secondary';
      default: return 'default';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'reach': return 'bg-red-50 border-red-200';
      case 'target': return 'bg-yellow-50 border-yellow-200';
      case 'safety': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${getCategoryBg(result.category)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">#{rank}</Badge>
              <Badge variant={getCategoryColor(result.category)} className="text-xs capitalize">
                {result.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                World Rank #{result.ranking}
              </Badge>
            </div>
            <CardTitle className="text-xl">{result.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {result.location}, {result.country}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{result.matchScore}%</div>
            <div className="text-sm text-gray-500">Match Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={result.matchScore} className="h-2" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Requirements</div>
            <div>GPA: {result.requirements.minGPA}+</div>
            <div>TOEFL: {result.requirements.minTOEFL}+</div>
            <div>SAT: {result.requirements.minSAT}+</div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Statistics</div>
            <div>Acceptance: {result.acceptanceRate}%</div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${result.tuitionUSD.toLocaleString()}/year
            </div>
            <div>Type: {result.type === 'private' ? 'Private' : 'Public'}</div>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium">Strong Majors</div>
            <div className="flex flex-wrap gap-1">
              {result.strongMajors.slice(0, 3).map(major => (
                <Badge key={major} variant="outline" className="text-xs">
                  {major}
                </Badge>
              ))}
              {result.strongMajors.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{result.strongMajors.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium text-sm">Analysis</div>
          <p className="text-sm text-gray-600">{result.description}</p>
          {result.reasons.length > 0 && (
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {result.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityMatcher; 