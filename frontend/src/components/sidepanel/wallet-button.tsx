import { useAccount, useConnect, useDisconnect } from 'wagmi';

import { Loader2, LogOut, Wallet } from 'lucide-react';
import { Button } from '../ui/button';


const WalletButton = ({ viewOnly = false }: { viewOnly?: boolean }) => {
  const shortAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  const { address } = useAccount()
  const { connectors, connect, status } = useConnect()
  const { disconnect } = useDisconnect()

  const isLoading = status === 'pending'

  return (
    <div className="bg-linear-to-br from-violet-100/60 to-purple-100/60 backdrop-blur-sm p-5 rounded-3xl border border-violet-200/50">
      {address ? (
        <>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>

            <div className="flex-1">
              <p className="text-xs text-violet-600">Connected</p>
              <p className="text-violet-900">{shortAddress(address)}</p>
            </div>
          </div>

          {!viewOnly &&
            <Button
              variant="outline"
              className="w-full rounded-xl border-violet-200 text-red-600 hover:bg-red-50 hover:border-red-200 mt-4"
              onClick={() => disconnect()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          }
        </>
      ) : (
        <div className='flex gap-2 flex-col'>
          {connectors.map((c) => (
            <Button
              key={c.uid}
              variant="outline"
              className="w-full rounded-xl border-violet-200 text-violet-900 hover:bg-violet-50"
              onClick={() => connect({ connector: c })}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting with {c.name}...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect with {c.name}
                </>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletButton;