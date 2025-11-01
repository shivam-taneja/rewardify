
import { useMutation, useQuery } from "@tanstack/react-query";
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

import { useAccount, useSignMessage } from "wagmi";

const LeaderboardView = () => {
  const [channel, setChannel] = useState<{ channelId: string | null }>({ channelId: null });

  // Withdraw state
  // Recipients hardcoded: Top watchers
  const recipients = [
    "0x52da84ecc16519cdc63bb28a64ce6f51ad6f1abf",
    "0x2211ee747c6905b6343f305e7685dc7f68edebfd"
  ];
  // Hardcode withdrawal amounts as demo (e.g. equally split 1 ETH)
  const amounts = ["0.5", "0.5"]; // Send 0.5 ETH to each
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  // Mutation for withdraw
  const { mutateAsync: triggerWithdraw, isPending: isWithdrawing, isSuccess: withdrawSuccess, isError: withdrawFailed } = useMutation({
    mutationFn: async () => {
      if (!channel.channelId || !address) throw new Error("Missing channel or address");
      if (recipients.some(r => !r) || amounts.some(a => !a || isNaN(Number(a)))) throw new Error("Missing or invalid fields");
      const weiAmounts = amounts.map(a => BigInt(Math.floor(Number(a) * 1e18)).toString());
      const msg = `Withdraw pool for channel: ${channel.channelId} to ${recipients.join(",")} amounts: ${weiAmounts.join(",")} by: ${address}`;
      const signature = await signMessageAsync({ message: msg });
      await axios.post("http://localhost:3003/withdraw", {
        channelId: channel.channelId,
        recipients,
        amounts: weiAmounts,
        signature,
        message: msg,
      });
    },
    onSuccess: () => {
      setWithdrawError(null);
    },
    onError: (err: any) => {
      setWithdrawError(err?.response?.data?.error || "Failed to withdraw");
    }
  });

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

      <div className="mb-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
        <div className="text-sm font-bold mb-3">Pool Withdrawal Targets</div>
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between rounded border border-orange-200 px-3 py-2 bg-white">
            <span className="font-mono text-xs text-orange-700 ">
              0x52da...1abf
            </span>
            <span className="font-bold text-orange-900 text-sm">Top watcher #1</span>
          </div>
          <div className="flex items-center justify-between rounded border border-orange-200 px-3 py-2 bg-white">
            <span className="font-mono text-xs text-orange-700">
              0x2211...ebfd
            </span>
            <span className="font-bold text-orange-900 text-sm">Top watcher #2</span>
          </div>
        </div>
        <button
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 font-semibold rounded-xl disabled:bg-gray-300 mt-2"
          disabled={isWithdrawing || !isConnected || !channel.channelId}
          onClick={() => { setWithdrawError(null); triggerWithdraw(); }}
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw & Distribute"}
        </button>
        {withdrawError && <div className="text-red-500 text-xs mt-2">{withdrawError}</div>}
        {withdrawSuccess && !isWithdrawing && <div className="text-green-600 text-xs mt-2">Withdrawal successful!</div>}
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
