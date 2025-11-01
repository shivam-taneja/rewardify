
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Gift, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import TipModal from "./tip-modal";
import WalletButton from "./wallet-button";

type ChannelInfo = {
  name: string | null;
  avatarUrl: string | null;
  subCount: string | null;
  channelId: string | null;
};

const DEFAULT_CHANNEL: ChannelInfo = {
  name: null,
  avatarUrl: null,
  subCount: null,
  channelId: null,
};

const HomeTab = () => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [channel, setChannel] = useState<ChannelInfo>(DEFAULT_CHANNEL);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const {
    data: regInfo,
    isLoading: isRegLoading,
    refetch: refetchReg
  } = useQuery({
    queryKey: ["is-registered", channel.channelId],
    queryFn: async () => {
      if (!channel.channelId) return null;
      const { data } = await axios.get(`http://localhost:3003/is-registered/${encodeURIComponent(channel.channelId)}`);
      return data;
    },
    enabled: Boolean(channel.channelId),
    retry: false,
    refetchOnWindowFocus: false
  });

  // Listen for live channel info updates from the content script
  useEffect(() => {
    function handleMessage(msg: any) {
      if (msg.type === "CHANNEL_INFO_UPDATED") {
        setChannel(msg.info || DEFAULT_CHANNEL);
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // On first load, ask content script for current channel info
  useEffect(() => {
    chrome.tabs.query(
      { active: true, currentWindow: true, url: "https://www.youtube.com/*" },
      (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "GET_CHANNEL_INFO" },
            (resp) => {
              setChannel(resp || DEFAULT_CHANNEL);
            }
          );
        } else {
          setChannel(DEFAULT_CHANNEL);
        }
      }
    );
  }, []);

  const regExists = (regInfo && regInfo.exists) || false;

  const { mutateAsync: verifyChannel, isPending } = useMutation({
    mutationFn: async () => {
      if (!channel.channelId || !address) throw new Error();
      const msg = `Verify ownership for channel: ${channel.channelId}\nWallet: ${address}`;
      const signature = await signMessageAsync({ message: msg });
      await axios.post(`http://localhost:3003/register`, { channelId: channel.channelId, owner: address, signature });
    },
    onSuccess: () => {
      refetchReg();
    }
  });

  const avatarFallback =
    channel.name
      ? channel.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
      : "NA";

  const isChannelAvailable = Boolean(channel.name);

  console.log(regExists)

  return (
    <div className="mt-2 space-y-4">
      <WalletButton viewOnly />

      <div className="bg-linear-to-br from-fuchsia-100/60 to-pink-100/60 backdrop-blur-sm p-5 rounded-3xl border border-fuchsia-200/50">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
            <AvatarImage src={isChannelAvailable ? channel.avatarUrl || "" : ""} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isChannelAvailable ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-fuchsia-700">Watching Now</span>
                </>
              ) : (
                <span className="text-xs text-fuchsia-700 opacity-60">
                  No YouTube channel detected. Please open a video to continue.
                </span>
              )}
            </div>

            <p className="text-fuchsia-900">{channel.name || "..."}</p>
            <p className="text-xs text-fuchsia-700">{channel.subCount || ""}</p>
            {channel.channelId && (
              <p className="text-[10px] text-fuchsia-500 break-all max-w-xs">{channel.channelId}</p>
            )}

            {channel.channelId && (
              <div className="flex items-center gap-2 mt-1">
                {isRegLoading && (
                  <>
                    <ShieldAlert className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                    <span className="text-xs text-fuchsia-500">Checking...</span>
                  </>
                )}
                {!isRegLoading && !regExists && !isPending && (
                  <>
                    <ShieldAlert className="w-4 h-4 text-yellow-500" />
                    <button
                      className="text-xs text-yellow-700 underline hover:opacity-70 px-1 cursor-pointer"
                      onClick={() => verifyChannel}
                      disabled={isPending}
                    >
                      Channel not registered. Link & verify
                    </button>
                  </>
                )}

                {isPending && (
                  <>
                    <ShieldAlert className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-xs text-yellow-700">Verifying...</span>
                  </>
                )}

                {regExists && !isPending && (
                  <>
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Channel linked!</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowTipModal(true)}
        className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        disabled={
          !isConnected ||
          !isChannelAvailable ||
          !regExists
        }
      >
        <Gift className="w-5 h-5 mr-2" />
        {!isChannelAvailable ? (
          <span>
            No YouTube channel detected. <br /> Please open a video to continue.
          </span>
        ) : !isConnected ? (
          <span>
            Connect Wallet to Tip {channel.name}
          </span>
        ) : isRegLoading ? (
          <span>
            Checking channel status...
          </span>
        ) : !regExists ? (
          <span>
            Link and verify your channel to enable tips
          </span>
        ) : (
          <span>
            Send Tip to {channel.name}
          </span>
        )}
      </Button>

      {channel.name && channel.channelId &&
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          channelName={channel.name}
          channelId={channel.channelId}
        />
      }
    </div>
  );
};

export default HomeTab;