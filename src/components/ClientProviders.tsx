"use client";

import { SessionProvider } from "next-auth/react";
import useDevToolsDetection from "@/hooks/useDevToolsDetection";
import { LanguageProvider } from "@/context/LanguageContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { SubscriptionProvider, useSubscription } from "@/context/SubscriptionContext";
import PremiumModal from "./PremiumModal";


export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <WatchlistProvider>
          <SubscriptionProvider>
            <GlobalModalHandler>
              <DevToolsWatcher />
              {children}
            </GlobalModalHandler>
          </SubscriptionProvider>
        </WatchlistProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

function DevToolsWatcher() {
  useDevToolsDetection();
  return null;
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




