import { useEffect, useState } from "react";

import { useAccount } from "wagmi";

import TipModal from "./tip-modal";
import WalletButton from "./wallet-button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

type ChannelInfo = {
  name: string | null;
  avatarUrl: string | null;
  subCount: string | null;
};

const DEFAULT_CHANNEL: ChannelInfo = {
  name: null,
  avatarUrl: null,
  subCount: null,
};

const HomeTab = () => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [channel, setChannel] = useState<ChannelInfo>(DEFAULT_CHANNEL);

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

  const avatarFallback =
    channel.name
      ? channel.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
      : "NA";

  const isChannelAvailable = Boolean(channel.name);

  const { isConnected } = useAccount()

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
                  <span className="text-xs text-fuchsia-700">
                    Watching Now
                  </span>
                </>
              ) : (
                <span className="text-xs text-fuchsia-700 opacity-60">
                  No YouTube channel detected. Please open a video to continue.
                </span>
              )}
            </div>

            <p className="text-fuchsia-900">{channel.name || "..."}</p>
            <p className="text-xs text-fuchsia-700">
              {channel.subCount || ""}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowTipModal(true)}
        className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
        disabled={!isConnected || !isChannelAvailable}
      >
        <Gift className="w-5 h-5 mr-2" />
        {!isChannelAvailable ?
          (
            <span className="">
              No YouTube channel detected. <br /> Please open a video to continue.
            </span>
          ) : (
            <>
              {!isConnected ? (
                <>
                  Connect Wallet to Tip {channel.name}
                </>
              ) : (
                <>
                  Send Tip to {channel.name}
                </>
              )}
            </>
          )}

      </Button>

      {channel.name &&
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          channelName={channel.name}
        />
      }
    </div>
  );
};

export default HomeTab;