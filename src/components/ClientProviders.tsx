"use client";

import useDevToolsDetection from "@/hooks/useDevToolsDetection";
import { LanguageProvider } from "@/context/LanguageContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { SubscriptionProvider, useSubscription } from "@/context/SubscriptionContext";
import PremiumModal from "./PremiumModal";


export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useDevToolsDetection();
  return (
    <LanguageProvider>
      <WatchlistProvider>
        <SubscriptionProvider>
          <GlobalModalHandler>
            {children}
          </GlobalModalHandler>
        </SubscriptionProvider>
      </WatchlistProvider>
    </LanguageProvider>
  );
}

function GlobalModalHandler({ children }: { children: React.ReactNode }) {
    const { isModalOpen, closeModal } = useSubscription();
    return (
        <>
            {children}
            <PremiumModal isOpen={isModalOpen} onClose={closeModal} />
        </>
    );
}




