import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAccount, useSignMessage } from "wagmi";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  channelId: string;
}

const TipModal = ({ isOpen, onClose, channelName, channelId }: TipModalProps) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const presetAmounts = [1, 5, 10, 25];

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { mutateAsync, isPending, isSuccess, isError } = useMutation({
    mutationFn: async () => {
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Amount must be greater than zero.");
      }
      if (!channelId || !address) {
        throw new Error("Missing channel or address");
      }
      const amountWei = (BigInt(Math.floor(Number(amount) * 1e18))).toString();
      const msg = `Tip to channel: ${channelId}, amount: ${amountWei}, from: ${address}`;
      const signature = await signMessageAsync({ message: msg });
      await axios.post(`http://localhost:3003/tip`, {
        channelId,
        amount: amountWei,
        tipperAddress: address,
        signature,
        message: msg,
      });
    },
    onSuccess: () => {
      setAmount("");
      setError(null);
    },
    onError: () => {
      setError("Failed to send tip. Try again.");
    },
  });

  const handleSendTip = async () => {
    setError(null);
    mutateAsync();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <div className="flex flex-col items-center mb-2">
          <DialogTitle className="text-2xl font-bold mb-1 text-violet-600">
            {isSuccess ? "Tip Sent!" : "Send a Tip"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isSuccess ? "Your support means everything" : `to ${channelName}`}
          </DialogDescription>
        </div>

        {!isSuccess && (
          <>
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Tip Amount (ETH)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  step="0.0001"
                  min="0"
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  className="pl-8 h-14 text-lg font-semibold rounded-2xl bg-muted/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Quick Tips
              </label>

              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setAmount(preset.toString())}
                    className={`rounded-xl h-12 font-semibold ${amount === preset.toString()
                      ? "border-primary bg-primary/10 text-primary"
                      : ""
                      }`}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            {isError && (
              <div className="text-red-500 text-sm mb-3 text-center">{error}</div>
            )}

            <Button
              size="lg"
              className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleSendTip}
              disabled={isPending || !isConnected}
            >
              {isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Tip
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TipModal;