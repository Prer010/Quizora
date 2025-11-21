import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Plus, Trash2, Image as ImageIcon, ArrowLeft, MoreVertical, Edit, Play } from "lucide-react"
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";


export default function Dashboard() {
  const Navigate = useNavigate();
  const { toast } = useToast();

  const myQuizzes = useQuery(api.quizzes.getMyQuizzes);
  const createSession = useMutation(api.sessions.createSession);
  const deleteQuiz = useMutation(api.quizzes.deleteQuiz);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-row w-full justify-end">
            <Button onClick={() => Navigate('/create-quiz')} className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-full border border-primary-foreground-30 mr-10 mt-5 p-5">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quiz
                      </Button>
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(myQuizzes || []).map((q: any) => (
                <Card key={String(q._id)} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{q.title}</h3>
                      {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                    </div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded hover:bg-muted/30">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => Navigate(`/create-quiz?quizId=${String(q._id)}`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => Navigate(`/quiz/${String(q._id)}`)}>
                            <Play className="mr-2 h-4 w-4" /> Run
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={async () => {
                            if (!confirm(`Delete quiz \"${q.title}\"? This cannot be undone.`)) return;
                            try {
                              await deleteQuiz({ id: q._id });
                              toast({ title: "Deleted", description: "Quiz deleted." });
                              // Force a refresh by reloading the page (Convex queries should update automatically, but refresh to be sure)
                              window.location.reload();
                            } catch (err: any) {
                              toast({ title: "Error", description: `Failed to delete quiz: ${err.message}`, variant: "destructive" });
                            }
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
