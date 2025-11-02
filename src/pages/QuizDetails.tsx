import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Copy, CheckCircle } from "lucide-react";

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_number');

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      const joinCode = generateCode();
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: id,
          join_code: joinCode,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/host/${session.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyQuizLink = () => {
    const link = `${window.location.origin}/quiz/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link Copied!", description: "Share this link with others" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {quiz?.title}
          </h1>
          {quiz?.description && (
            <p className="text-muted-foreground mb-6">{quiz.description}</p>
          )}

          <div className="flex gap-4">
            <Button
              onClick={startQuiz}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Quiz
            </Button>
            <Button
              onClick={copyQuizLink}
              size="lg"
              variant="outline"
            >
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Questions ({questions.length})</h2>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">Question {index + 1}</h3>
                <span className="text-sm text-muted-foreground">{question.time_limit}s</span>
              </div>
              <p className="mb-3">{question.question_text}</p>
              {question.question_image_url && (
                <img 
                  src={question.question_image_url} 
                  alt="Question" 
                  className="w-full max-h-64 object-cover rounded-lg mb-3"
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = question[`option_${option.toLowerCase()}`];
                  if (!optionText) return null;
                  return (
                    <div 
                      key={option}
                      className={`p-3 rounded-lg border ${
                        question.correct_answer === option 
                          ? 'bg-success/10 border-success' 
                          : 'bg-muted'
                      }`}
                    >
                      <span className="font-bold mr-2">{option}.</span>
                      {optionText}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizDetails;