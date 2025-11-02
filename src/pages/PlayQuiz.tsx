import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Trophy, Loader2 } from "lucide-react";

const PlayQuiz = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participant');
  const { toast } = useToast();
  
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    loadData();
    subscribeToSession();
  }, [sessionId, participantId]);

  useEffect(() => {
    if (timeLeft > 0 && session?.status === 'active' && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, session?.status, hasAnswered]);

  const loadData = async () => {
    const { data: sessionData } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      setSession(sessionData);
      
      if (sessionData.status === 'active') {
        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', sessionData.quiz_id)
          .order('order_number');

        if (questionsData && questionsData[sessionData.current_question_index]) {
          const question = questionsData[sessionData.current_question_index];
          setCurrentQuestion(question);
          setTimeLeft(question.time_limit);
          checkIfAnswered(question.id);
        }
      }
    }

    const { data: participantData } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (participantData) {
      setParticipant(participantData);
    }

    loadParticipants();
  };

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    
    if (data) setParticipants(data);
  };

  const checkIfAnswered = async (questionId: string) => {
    const { data } = await supabase
      .from('answers')
      .select('answer')
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)
      .eq('question_id', questionId)
      .single();

    if (data) {
      setSelectedAnswer(data.answer);
      setHasAnswered(true);
    } else {
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const subscribeToSession = () => {
    const channel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`
        },
        () => {
          loadData();
          loadParticipants();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const submitAnswer = async (answer: string) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const timeTaken = currentQuestion.time_limit - timeLeft;
    
    const { error } = await supabase
      .from('answers')
      .insert({
        session_id: sessionId,
        participant_id: participantId,
        question_id: currentQuestion.id,
        answer,
        time_taken: timeTaken
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    if (answer === currentQuestion.correct_answer) {
      const points = Math.max(100, 1000 - (timeTaken * 10));
      
      await supabase
        .from('participants')
        .update({ score: (participant?.score || 0) + points })
        .eq('id', participantId);

      setParticipant({ ...participant, score: (participant?.score || 0) + points });
    }
  };

  const getAnswerColor = (option: string) => {
    const colors = {
      A: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      B: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      C: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      D: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    };
    return colors[option as keyof typeof colors];
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10 p-4">
      <div className="container max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Welcome,</p>
              <p className="text-xl font-bold">{participant?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Score</p>
              <p className="text-2xl font-bold text-primary">{participant?.score || 0}</p>
            </div>
          </div>
        </Card>

        {session.status === 'waiting' && (
          <Card className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Get Ready!</h2>
            <p className="text-xl text-muted-foreground">
              Waiting for the host to start the quiz...
            </p>
          </Card>
        )}

        {session.status === 'active' && !session.show_leaderboard && currentQuestion && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Answer the question</h3>
              <div className="flex items-center gap-2 text-warning">
                <Clock className="h-5 w-5" />
                <span className="text-xl font-bold">{timeLeft}s</span>
              </div>
            </div>

            <div className="p-6 bg-muted rounded-lg mb-6">
              <p className="text-xl font-semibold mb-4">{currentQuestion.question_text}</p>
              {currentQuestion.question_image_url && (
                <img 
                  src={currentQuestion.question_image_url} 
                  alt="Question" 
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map(option => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}`];
                if (!optionText) return null;
                
                return (
                  <Button
                    key={option}
                    onClick={() => submitAnswer(option)}
                    disabled={hasAnswered || timeLeft === 0}
                    className={`h-auto py-6 px-6 text-left justify-start bg-gradient-to-br ${getAnswerColor(option)} text-white disabled:opacity-50 ${
                      selectedAnswer === option ? 'ring-4 ring-white' : ''
                    }`}
                  >
                    <span className="text-2xl font-bold mr-3">{option}</span>
                    <span className="text-lg">{optionText}</span>
                  </Button>
                );
              })}
            </div>

            {hasAnswered && (
              <p className="text-center mt-6 text-lg font-semibold text-success">
                Answer submitted! Wait for the next question...
              </p>
            )}
          </Card>
        )}

        {session.status === 'active' && session.show_leaderboard && (
          <Card className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-warning" />
            <h2 className="text-3xl font-bold mb-8">Current Standings</h2>
            
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div 
                  key={p.id}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    p.id === participantId ? 'bg-primary/20 border-2 border-primary' :
                    i === 0 ? 'bg-warning/20 border-2 border-warning' :
                    'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{i + 1}</span>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {session.status === 'finished' && (
          <Card className="p-12 text-center">
            <Trophy className="h-20 w-20 mx-auto mb-4 text-warning" />
            <h2 className="text-4xl font-bold mb-4">Quiz Finished!</h2>
            <p className="text-2xl mb-8">Your final score: <span className="font-bold text-primary">{participant?.score || 0}</span></p>
            
            <h3 className="text-2xl font-bold mb-4">Final Rankings</h3>
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div 
                  key={p.id}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    p.id === participantId ? 'bg-primary/20 border-2 border-primary' :
                    i === 0 ? 'bg-warning/20 border-2 border-warning' :
                    'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{i + 1}</span>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{p.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlayQuiz;