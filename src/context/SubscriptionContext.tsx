"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type SubscriptionPlan = "FREE" | "PREMIUM";

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  setPlan: (plan: SubscriptionPlan) => void;
  isPremium: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<SubscriptionPlan>("FREE");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isPremium = plan === "PREMIUM";
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <SubscriptionContext.Provider value={{ plan, setPlan, isPremium, isModalOpen, openModal, closeModal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}


export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
