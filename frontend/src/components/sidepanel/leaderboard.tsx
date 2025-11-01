
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import axios from "axios";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy } from "lucide-react";

const topFans = [
  {
    rank: 1,
    username: "0x742d...9c4a",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=fan1",
    watchTime: "124h",
    rewardShare: "12.4%",
    tips: "$450"
  },
  {
    rank: 2,
    username: "0x8b3f...2e1c",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=fan2",
    watchTime: "98h",
    rewardShare: "9.8%",
    tips: "$320"
  },
  {
    rank: 3,
    username: "0x1a5c...7d9b",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=fan3",
    watchTime: "87h",
    rewardShare: "8.7%",
    tips: "$280"
  },
  {
    rank: 4,
    username: "0x9e2d...4f8a",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=fan4",
    watchTime: "76h",
    rewardShare: "7.6%",
    tips: "$215"
  },
  {
    rank: 5,
    username: "0x3c7b...6a1e",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=fan5",
    watchTime: "65h",
    rewardShare: "6.5%",
    tips: "$180"
  },
];

const LeaderboardView = () => {
  const [channel, setChannel] = useState<{ channelId: string | null }>({ channelId: null });

  useEffect(() => {
    chrome.tabs?.query(
      { active: true, currentWindow: true, url: "https://www.youtube.com/*" },
      (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "GET_CHANNEL_INFO" },
            (resp) => {
              setChannel({ channelId: resp?.channelId || null });
            }
          );
        } else {
          setChannel({ channelId: null });
        }
      }
    );
  }, []);

  const {
    data: poolInfo,
    isLoading: isPoolLoading
  } = useQuery({
    queryKey: ["pool-balance", channel.channelId],
    queryFn: async () => {
      if (!channel.channelId) return null;
      const { data } = await axios.get(`http://localhost:3003/pool-balance/${encodeURIComponent(channel.channelId)}`);
      return data;
    },
    enabled: Boolean(channel.channelId),
    retry: false
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-500" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-800" />;
      default:
        return <Trophy className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="my-4 rounded-xl border p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">
          Channel Reward Pool
        </div>
        <div className="text-2xl font-bold">
          {isPoolLoading
            ? "Loading..."
            : poolInfo && poolInfo.balanceEth
              ? `${poolInfo.balanceEth} ETH`
              : "Unavailable"}
        </div>
        {channel.channelId && (
          <div className="text-xs text-muted-foreground mt-1 break-all">
            Channel ID: <span className="font-mono">{channel.channelId}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {topFans.map((fan) => (
          <div
            key={fan.rank}
            className="group backdrop-blur-sm rounded-2xl p-4 border border-primary/30 shadow"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 min-w-12">
                {getRankIcon(fan.rank)}

                <Badge className="bg-linear-to-r from-violet-600 to-fuchsia-600 text-white">
                  #{fan.rank}
                </Badge>
              </div>

              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={fan.avatar} alt={fan.username} />
                <AvatarFallback>{fan.rank}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{fan.username}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{fan.watchTime} watched</span>
                  <span>•</span>
                  <span>{fan.tips} tipped</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-violet-600">
                  {fan.rewardShare}
                </p>

                <p className="text-xs text-muted-foreground">reward</p>
              </div>
            </div>
          </div>
        ))}

        {/* {!isConnected ? (
          <div className="border border-primary/30 rounded-2xl py-2 text-center w-full bg-white/80">
            <p className="text-sm font-bold text-gray-500">
              Connect with wallet to get your ranking!
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="border border-primary/30 rounded-2xl py-2 text-center w-full bg-white/80">
              <div className="flex gap-2 items-center justify-center text-gray-500">
                <Coins className="w-4 h-4" />
                <p className="text-sm">Your Earnings</p>
              </div>

              <p className="text-2xl font-bold text-violet-400 flex justify-center">
                {loading ? (
                  <Loader2 className="text-sm animate-spin" />
                ) : (
                  <>
                    ${value}
                  </>
                )}
              </p>
            </div>

            <div className="border border-primary/30 rounded-2xl py-2 text-center w-full bg-white/80">
              <div className="flex gap-2 items-center justify-center text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <p className="text-sm">Your Rank</p>
              </div>

              <p className="text-2xl font-bold text-violet-400 flex justify-center">
                {loading ? (
                  <Loader2 className="text-sm animate-spin" />
                ) : (
                  <>
                    #{value}
                  </>
                )}
              </p>
            </div>
          </div>
        )} */}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">How it works:</span> Your reward share is based on your watch time. The more you engage, the bigger your slice of the reward pool!
        </p>
      </div>
    </div>
  );
};

export default LeaderboardView;
