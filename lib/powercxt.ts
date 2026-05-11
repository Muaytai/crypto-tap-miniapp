const BASE_LOGIN =
  "https://tkxn.org/login/?force_login=true";

export function getPowercxtRegistrationUrl(): string {
  const params = new URLSearchParams({
    utm_source: "powercxt",
    utm_medium: "miniapp",
    utm_campaign: "finale",
  });
  return `${BASE_LOGIN}&${params.toString()}`;
}
