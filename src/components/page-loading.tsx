"use client";

import { createContext, useContext, useEffect, useId } from "react";
import type { PageLoadingContextValue } from "./loading-transition-types";

export const PageLoadingContext = createContext<PageLoadingContextValue | null>(null);

export function usePageLoading(loading: boolean) {
	const context = useContext(PageLoadingContext);
	const id = useId();

	useEffect(() => {
		context?.reportLoading(id, loading);
		return () => context?.reportLoading(id, false);
	}, [context, id, loading]);
}
