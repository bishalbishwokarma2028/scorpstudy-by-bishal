import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAiGenerateQuiz, useSaveQuizResult } from "@workspace/api-client-react";
import { CheckSquare, Loader2, Save, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("Multiple Choice");
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  const generateQuiz = useAiGenerateQuiz();
  const saveQuiz = useSaveQuizResult();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    
    setQuestions([]);
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    
    try {
      const response = await generateQuiz.mutateAsync({ 
        data: { 
          topic, 
          count: parseInt(count), 
          difficulty, 
          type 
        } 
      });
      setQuestions(response.questions);
      toast.success("Quiz generated!");
    } catch (error) {
      toast.error("Failed to generate quiz");
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    
    let calculatedScore = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    
    setScore(calculatedScore);
    setIsSubmitted(true);
    
    try {
      await saveQuiz.mutateAsync({
        data: {
          topic,
          score: calculatedScore,
          total: questions.length,
          questions
        }
      });
      toast.success("Quiz results saved to history");
    } catch (error) {
      toast.error("Failed to save results");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-violet-600" />
            Quiz Generator
          </h1>
          <p className="text-slate-500 mt-1">Test your knowledge with custom AI-generated quizzes.</p>
        </div>

        {!questions.length ? (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Create a New Quiz</CardTitle>
              <CardDescription>Configure your quiz parameters below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input 
                  id="topic" 
                  placeholder="e.g., Cellular Respiration, World War II, React Hooks" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                      <SelectItem value="True-False">True/False</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={generateQuiz.isPending || !topic.trim()} className="w-full bg-violet-600 hover:bg-violet-700">
                {generateQuiz.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                Generate Quiz
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-violet-50 border-violet-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-violet-900">{topic} Quiz</h2>
                  <p className="text-violet-700 text-sm">{questions.length} questions • {difficulty}</p>
                </div>
                {isSubmitted && (
                  <div className="text-right">
                    <div className="text-3xl font-black text-violet-700">{score}/{questions.length}</div>
                    <div className="text-sm font-medium text-violet-600">{Math.round((score / questions.length) * 100)}%</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className={`border-slate-200 ${isSubmitted ? (answers[qIndex] === q.correctAnswer ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30') : ''}`}>
                <CardHeader>
                  <CardTitle className="text-base leading-relaxed flex gap-2">
                    <span className="text-slate-400">{qIndex + 1}.</span> 
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={answers[qIndex] || ""} 
                    onValueChange={(val) => !isSubmitted && setAnswers(prev => ({...prev, [qIndex]: val}))}
                    className="space-y-3"
                  >
                    {q.options.map((opt, oIndex) => {
                      let itemClass = "flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer transition-colors";
                      let icon = null;
                      
                      if (!isSubmitted) {
                        itemClass += answers[qIndex] === opt ? " border-violet-600 bg-violet-50" : " border-slate-200 hover:bg-slate-50";
                      } else {
                        if (opt === q.correctAnswer) {
                          itemClass += " border-green-500 bg-green-100 text-green-900";
                          icon = <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />;
                        } else if (answers[qIndex] === opt && opt !== q.correctAnswer) {
                          itemClass += " border-red-500 bg-red-100 text-red-900";
                          icon = <XCircle className="w-5 h-5 text-red-600 ml-auto" />;
                        } else {
                          itemClass += " border-slate-200 opacity-60";
                        }
                      }
                      
                      return (
                        <Label key={oIndex} className={itemClass}>
                          <RadioGroupItem value={opt} id={`q${qIndex}-o${oIndex}`} disabled={isSubmitted} className={isSubmitted ? "opacity-0 absolute" : ""} />
                          <span className="flex-1 font-medium">{opt}</span>
                          {icon}
                        </Label>
                      );
                    })}
                  </RadioGroup>
                  
                  {isSubmitted && (
                    <div className="mt-4 p-4 rounded-lg bg-white border border-slate-100 text-sm">
                      <p className="font-semibold text-slate-700 mb-1">Explanation:</p>
                      <p className="text-slate-600">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setQuestions([])}>
                <RefreshCw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              {!isSubmitted && (
                <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700 px-8">
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
