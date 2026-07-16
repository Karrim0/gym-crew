"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import { useEffect, useState } from "react";
import type { UUID } from "@/types";
import { fetchAdherenceSummary } from "../services/progress.service";

export interface UseAdherenceResult {
  weekly: number | null;
  monthly: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdherence(userId: UUID): UseAdherenceResult {
  const [state, setState] = useState<UseAdherenceResult>({
    weekly: null,
    monthly: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    fetchAdherenceSummary(userId)
      .then((summary) => setState({ weekly: summary.weekly, monthly: summary.monthly, isLoading: false, error: null }))
      .catch((caught) => setState({
        weekly: null,
        monthly: null,
        isLoading: false,
        error: getArabicErrorMessage(caught, "معرفناش نحمّل الالتزام."),
      }));
  }, [userId]);

  return state;
}
