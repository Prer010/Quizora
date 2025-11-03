import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, Trophy, Loader2 } from "lucide-react";

const PlayQuiz = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participant');
  const { toast } = useToast();
  
  const [session, setSession] = useState<any>({
    status: "waiting",
    show_leaderboard: false
  });
  const [currentQuestion, setCurrentQuestion] = useState<any>({
    question_text: "Sample Question",
    option_a: "Option A",
    option_b: "Option B",
    option_c: "Option C",
    option_d: "Option D",
    time_limit: 30
  });
  const [participant, setParticipant] = useState<any>({
    name: "Player",
    score: 0
  });
  const [participants, setParticipants] = useState<any[]>([
    { id: 1, name: "Player 1", score: 100 },
    { id: 2, name: "Player 2", score: 50 }
  ]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answerStats, setAnswerStats] = useState<Record<string, number>>({
    A: 5,
    B: 12,
    C: 3,
    D: 8
  });

  useEffect(() => {
    // TODO: Replace with your backend WebSocket/SSE connection
    // const ws = new WebSocket(`ws://your-backend/sessions/${sessionId}?participant=${participantId}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setSession(data.session);
    //   setCurrentQuestion(data.currentQuestion);
    //   setTimeLeft(data.timeLeft);
    //   setParticipants(data.participants);
    // };
  }, [sessionId, participantId]);

  useEffect(() => {
    if (timeLeft > 0 && session?.status === 'active' && !hasAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, session?.status, hasAnswered]);

  const handleOptionSelect = (option: string) => {
    if (hasAnswered || timeLeft === 0) return;
    setSelectedAnswer(option);
  };

  const submitAnswer = async () => {
    if (hasAnswered || !selectedAnswer || !currentQuestion) return;

    setHasAnswered(true);

    try {
      // TODO: Replace with your backend API call
      // await fetch('/api/answers', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     participantId, 
      //     questionId: currentQuestion.id, 
      //     answer: selectedAnswer,
      //     timeTaken: currentQuestion.time_limit - timeLeft 
      //   })
      // });
      
      toast({ title: "Answer submitted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getTotalAnswers = () => {
    return Object.values(answerStats).reduce((sum, count) => sum + count, 0);
  };

  const getPercentage = (option: string) => {
    const total = getTotalAnswers();
    return total > 0 ? Math.round((answerStats[option] / total) * 100) : 0;
  };

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
          <Card className="p-8 bg-card border-border rounded-3xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-semibold text-muted-foreground">Question</h3>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">{timeLeft}s</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-2xl font-bold mb-6">{currentQuestion.question_text}</p>
              {currentQuestion.question_image_url && (
                <img 
                  src={currentQuestion.question_image_url} 
                  alt="Question" 
                  className="w-full max-h-64 object-contain rounded-2xl"
                />
              )}
            </div>

            <div className="space-y-4 mb-6">
              {['A', 'B', 'C', 'D'].map(option => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}`];
                if (!optionText) return null;
                
                const isSelected = selectedAnswer === option;
                const percentage = hasAnswered ? getPercentage(option) : 0;
                
                return (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                      hasAnswered 
                        ? 'cursor-default' 
                        : 'hover:border-primary/50'
                    } ${
                      isSelected && !hasAnswered
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-card/50'
                    } ${
                      hasAnswered && isSelected
                        ? 'border-primary bg-primary/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {option}
                      </div>
                      <span className="text-lg font-medium flex-1">{optionText}</span>
                      {hasAnswered && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{answerStats[option]} votes</div>
                          <div className="text-lg font-bold text-primary">{percentage}%</div>
                        </div>
                      )}
                    </div>
                    {hasAnswered && (
                      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!hasAnswered ? (
              <div className="flex justify-center">
                <Button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || timeLeft === 0}
                  size="lg"
                  className="w-64 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-lg"
                >
                  Submit Answer
                </Button>
              </div>
            ) : (
              <p className="text-center text-lg font-semibold text-primary">
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
