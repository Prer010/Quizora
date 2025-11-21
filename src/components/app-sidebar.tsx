import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import TeamSwitcher from "@/components/team-switcher"
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Quizzes",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      // items will be filled dynamically from the Convex DB
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Fetch quizzes created by the currently authenticated user
  const myQuizzes = useQuery(api.quizzes.getMyQuizzes);

  // Map the quizzes to nav items; when not loaded yet, keep the static placeholder
  const quizItems =
    myQuizzes && myQuizzes.length > 0
      ? myQuizzes.map((q: any) => ({ title: q.title || "Untitled", url: `/quiz/${String(q._id)}` }))
      : [
          { title: "History", url: "#" },
          { title: "Starred", url: "#" },
        ];

  const navMain = [
    {
      title: "Quizzes",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: quizItems,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
