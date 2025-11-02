import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Play, SkipForward, Trophy, Clock } from "lucide-react";

const HostQuiz = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
    subscribeToParticipants();
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft > 0 && session?.status === 'active') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && session?.status === 'active' && currentQuestion) {
      showLeaderboard();
    }
  }, [timeLeft, session?.status]);

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', sessionData.quiz_id)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', sessionData.quiz_id)
        .order('order_number');

      if (questionsError) throw questionsError;

      setSession(sessionData);
      setQuiz(quizData);
      setQuestions(questionsData);
      
      if (sessionData.status === 'active' && questionsData[sessionData.current_question_index]) {
        setCurrentQuestion(questionsData[sessionData.current_question_index]);
        setTimeLeft(questionsData[sessionData.current_question_index].time_limit);
      }

      setLoading(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      navigate('/');
    }
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => loadParticipants()
      )
      .subscribe();

    loadParticipants();
    return () => { supabase.removeChannel(channel); };
  };

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    
    if (data) setParticipants(data);
  };

  const startQuiz = async () => {
    if (questions.length === 0) return;
    
    await supabase
      .from('quiz_sessions')
      .update({ status: 'active', current_question_index: 0 })
      .eq('id', sessionId);

    setSession({ ...session, status: 'active', current_question_index: 0 });
    setCurrentQuestion(questions[0]);
    setTimeLeft(questions[0].time_limit);
  };

  const showLeaderboard = async () => {
    await supabase
      .from('quiz_sessions')
      .update({ show_leaderboard: true })
      .eq('id', sessionId);

    setSession({ ...session, show_leaderboard: true });
  };

  const nextQuestion = async () => {
    const nextIndex = session.current_question_index + 1;
    
    if (nextIndex >= questions.length) {
      await supabase
        .from('quiz_sessions')
        .update({ status: 'finished' })
        .eq('id', sessionId);
      
      setSession({ ...session, status: 'finished' });
      return;
    }

    await supabase
      .from('quiz_sessions')
      .update({ 
        current_question_index: nextIndex,
        show_leaderboard: false
      })
      .eq('id', sessionId);

    setSession({ 
      ...session, 
      current_question_index: nextIndex,
      show_leaderboard: false 
    });
    setCurrentQuestion(questions[nextIndex]);
    setTimeLeft(questions[nextIndex].time_limit);
  };

  const skipLeaderboard = () => {
    nextQuestion();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <div className="container max-w-6xl mx-auto">
        <Card className="p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{quiz?.title}</h1>
              <p className="text-muted-foreground">Join Code: <span className="text-2xl font-bold text-primary">{session?.join_code}</span></p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold">{participants.length}</span>
              </div>
            </div>
          </div>

          {session?.status === 'waiting' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Waiting for participants...</h2>
              <p className="text-muted-foreground mb-6">
                Share the code above for players to join
              </p>
              <Button
                onClick={startQuiz}
                disabled={participants.length === 0}
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Quiz
              </Button>
            </div>
          )}

          {session?.status === 'active' && !session?.show_leaderboard && currentQuestion && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Question {session.current_question_index + 1} of {questions.length}
                </h2>
                <div className="flex items-center gap-2 text-warning">
                  <Clock className="h-5 w-5" />
                  <span className="text-2xl font-bold">{timeLeft}s</span>
                </div>
              </div>

              <div className="p-6 bg-muted rounded-lg">
                <p className="text-2xl font-semibold mb-4">{currentQuestion.question_text}</p>
                {currentQuestion.question_image_url && (
                  <img 
                    src={currentQuestion.question_image_url} 
                    alt="Question" 
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionText = currentQuestion[`option_${option.toLowerCase()}`];
                  if (!optionText) return null;
                  
                  const colors = {
                    A: 'from-red-500 to-red-600',
                    B: 'from-blue-500 to-blue-600',
                    C: 'from-yellow-500 to-yellow-600',
                    D: 'from-green-500 to-green-600'
                  };

                  return (
                    <div 
                      key={option}
                      className={`p-6 rounded-xl bg-gradient-to-br ${colors[option as keyof typeof colors]} text-white`}
                    >
                      <span className="text-3xl font-bold mr-3">{option}</span>
                      <span className="text-xl">{optionText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {session?.status === 'active' && session?.show_leaderboard && (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-warning" />
              <h2 className="text-3xl font-bold mb-8">Leaderboard</h2>
              
              <div className="space-y-3 mb-8">
                {participants.map((p, i) => (
                  <div 
                    key={p.id}
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      i === 0 ? 'bg-warning/20 border-2 border-warning' :
                      i === 1 ? 'bg-muted border-2' :
                      i === 2 ? 'bg-muted border' :
                      'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{i + 1}</span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{p.score}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={skipLeaderboard}
                  size="lg"
                  variant="outline"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  Skip
                </Button>
                <Button
                  onClick={nextQuestion}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Next Question
                </Button>
              </div>
            </div>
          )}

          {session?.status === 'finished' && (
            <div className="text-center py-12">
              <Trophy className="h-20 w-20 mx-auto mb-4 text-warning" />
              <h2 className="text-4xl font-bold mb-8">Quiz Finished!</h2>
              
              <h3 className="text-2xl font-bold mb-4">Final Scores</h3>
              <div className="space-y-3 mb-8">
                {participants.map((p, i) => (
                  <div 
                    key={p.id}
                    className={`flex justify-between items-center p-4 rounded-lg ${
                      i === 0 ? 'bg-warning/20 border-2 border-warning' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{i + 1}</span>
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{p.score}</span>
                  </div>
                ))}
              </div>

              <Button onClick={() => navigate('/')} size="lg">
                Back to Home
              </Button>
            </div>
          )}
        </Card>

        {session?.status === 'waiting' && participants.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Participants ({participants.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {participants.map(p => (
                <div key={p.id} className="p-3 bg-muted rounded-lg text-center">
                  {p.name}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HostQuiz;