import { useState } from "react";

import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Settings, Trophy } from "lucide-react";
import HomeTab from "./home-tab";
import LeaderboardView from "./leaderboard";
import SettingsTab from "./settings-tab";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "leaderboard", label: "Rankings", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function SidepanelApp() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className='min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 items-center justify-center p-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex gap-2 items-center w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-5 px-4 transition-all cursor-pointer rounded-xl",
                activeTab === tab.id
                  ? "bg-white shadow-md text-violet-700"
                  : "text-violet-500 hover:text-violet-700 bg-gray-100"
              )}
            >
              <tab.icon />

              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="home">
          <HomeTab />
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardView />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
