import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const JoinQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const joinQuiz = async () => {
    if (!code.trim() || !name.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter both quiz code and your name",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('id, status')
        .eq('join_code', code.toUpperCase())
        .single();

      if (sessionError || !session) {
        toast({ 
          title: "Invalid Code", 
          description: "Quiz not found. Please check the code and try again.",
          variant: "destructive" 
        });
        return;
      }

      if (session.status === 'finished') {
        toast({ 
          title: "Quiz Ended", 
          description: "This quiz has already finished.",
          variant: "destructive" 
        });
        return;
      }

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({ session_id: session.id, name })
        .select()
        .single();

      if (participantError) throw participantError;

      navigate(`/play/${session.id}?participant=${participant.id}`);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
          Join Quiz
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter the quiz code to get started
        </p>

        <div className="space-y-6">
          <div>
            <Label htmlFor="code">Quiz Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="mt-2 text-center text-2xl font-bold tracking-widest"
            />
          </div>

          <div>
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2"
            />
          </div>

          <Button
            onClick={joinQuiz}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-secondary to-accent"
          >
            {loading ? "Joining..." : "Join Quiz"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JoinQuiz;