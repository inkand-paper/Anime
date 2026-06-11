"use client";

import { SessionProvider } from "next-auth/react";
import useDevToolsDetection from "@/hooks/useDevToolsDetection";
import { LanguageProvider } from "@/context/LanguageContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { SubscriptionProvider, useSubscription } from "@/context/SubscriptionContext";
import PremiumModal from "./PremiumModal";


export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useDevToolsDetection();
  return (
    <SessionProvider>
      <LanguageProvider>
        <WatchlistProvider>
          <SubscriptionProvider>
            <GlobalModalHandler>
              {children}
            </GlobalModalHandler>
          </SubscriptionProvider>
        </WatchlistProvider>
      </LanguageProvider>
    </SessionProvider>
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




