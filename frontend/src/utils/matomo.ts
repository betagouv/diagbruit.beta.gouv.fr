export const trackMatomoEvent = (
  category: string,
  action: string,
  name?: string,
  value?: number
) => {
  if (!window._paq) return;
  const args: any[] = ["trackEvent", category, action];
  if (name) args.push(name);
  if (value !== undefined) args.push(value);
  window._paq.push(args);
};
