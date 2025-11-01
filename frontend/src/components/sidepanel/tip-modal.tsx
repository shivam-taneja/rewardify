import { useState } from "react";

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
}

const MESSAGE_TO_SIGN = 'Please sign this message to verify your wallet'

const TipModal = ({ isOpen, onClose, channelName }: TipModalProps) => {
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const presetAmounts = [1, 5, 10, 25];

  const handleSendTip = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSending(true);

    await increment()
  };

  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const getSignature = async () => {
    const signature = await signMessageAsync({ message: MESSAGE_TO_SIGN })
    return signature
  }

  const increment = async () => {
    setIsSending(true)

    try {
      const signature = await getSignature()
      const res = await axios.post('http://localhost:3001/increment', { address, signature })

      if (res.status === 200) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      onClose();
      setIsSuccess(false);
      setIsSending(false)
      setAmount("");
    }
  }

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
                Tip Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 h-14 text-lg font-semibold rounded-2xl bg-muted/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Preset Amounts */}
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

            {/* Send Button */}
            <Button
              size="lg"
              className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleSendTip}
              disabled={isSending || !isConnected}
            >
              {isSending ? (
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