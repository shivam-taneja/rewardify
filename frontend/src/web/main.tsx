import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/button";
import { Sparkle, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import '../styles/index.css';

function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-20 left-20 w-96 h-96 bg-violet-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-fuchsia-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Original background image */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url("/hero-bg.jpg")` }}
      />
      {/* Flipped horizontally background image */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{
          backgroundImage: `url("/hero-bg.jpg")`,
          transform: "scaleX(-1)"
        }}
      />

      <div className="absolute inset-0 bg-linear-to-b from-background/10 via-background/60 to-background" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg mb-8 border border-violet-100">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            <span className="text-violet-900">Rewardify</span>
          </div>

          <h1 className="text-7xl md:text-8xl mb-6 text-violet-900 tracking-tight">
            Tip, Watch,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-fuchsia-600">
              Earn Rewards
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-violet-700/80 mb-12 max-w-2xl mx-auto">
            Support creators with Web3 tips and earn rewards for your engagement!
          </p>

          <Button
            size="lg"
            className="bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-10 py-4 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all h-auto"
            asChild
          >
            <a href="https://github.com/shivam-taneja/rewardify" target="_blank">
              <Sparkles className="mr-2 h-5 w-5" />

              Add Extension
            </a>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-16">
            {[
              { icon: Wallet, text: "Web3 Tipping" },
              { icon: Sparkle, text: "Reward Pools" },
              { icon: Users, text: "Leaderboards" },
            ].map((feature) => (
              <div
                key={feature.text}
                className="bg-white/60 backdrop-blur-md px-6 py-4 rounded-full border border-violet-100 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                  <span className="text-violet-900">{feature.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>
);
