import { Info } from "lucide-react";
import WalletButton from "./wallet-button";

const SettingsTab = () => {
  return (
    <div className="mt-2 space-y-4">
      <WalletButton />

      <div className="bg-linear-to-br from-violet-100/60 to-purple-100/60 backdrop-blur-sm p-5 rounded-2xl border border-violet-200/50 text-center">
        <div className="inline-flex p-3 bg-white rounded-2xl mb-3">
          <Info className="w-5 h-5 text-violet-600" />
        </div>

        <p className="text-violet-900">Rewardify</p>

        <p className="text-xs text-violet-600">Version 1.0.0</p>
      </div>
    </div>
  );
}

export default SettingsTab