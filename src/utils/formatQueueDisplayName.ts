import type { QueueDisplayMode } from "../settings/types";

const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"]);
const SURNAME_PARTICLES = new Set(["de", "del", "dela", "la", "van", "von", "san", "sta", "sta."]);

/**
 * Formats a student's name for the public Cashier / Registrar live queue cards
 * according to their privacy preference.
 *
 * - `full_name`:   "Mark Andrie A. Cantara"
 * - `initials`:    "M. A. Cantara"
 * - `ticket_only`: "Anonymous" (ticket code like C-003 is already displayed beside it)
 */
export function formatQueueDisplayName(
  userName: string | null | undefined,
  displayMode: QueueDisplayMode = "full_name"
): string {
  const cleaned = (userName ?? "").replace(/\s+/g, " ").trim();

  if (displayMode === "ticket_only") {
    return "Anonymous";
  }

  if (!cleaned) {
    return "SASCHED User";
  }

  if (displayMode === "full_name") {
    return cleaned;
  }

  // displayMode === "initials"
  if (cleaned.toLowerCase() === "sasched user" || cleaned.toLowerCase() === "anonymous") {
    return cleaned;
  }

  const tokens = cleaned.split(" ");
  if (tokens.length === 1) {
    return tokens[0];
  }

  // Identify trailing suffix (e.g., Jr., III) if present and there are at least 3 tokens
  let suffix = "";
  let endIdx = tokens.length - 1;
  if (tokens.length >= 3 && SUFFIXES.has(tokens[endIdx].toLowerCase())) {
    suffix = " " + tokens[endIdx];
    endIdx--;
  }

  // Identify surname and any preceding particles (e.g., "dela Cruz", "de la Rosa")
  let surnameStartIdx = endIdx;
  while (
    surnameStartIdx > 1 &&
    SURNAME_PARTICLES.has(tokens[surnameStartIdx - 1].toLowerCase())
  ) {
    surnameStartIdx--;
  }

  const surname = tokens.slice(surnameStartIdx, endIdx + 1).join(" ");
  const givenTokens = tokens.slice(0, surnameStartIdx);

  if (givenTokens.length === 0) {
    return `${surname}${suffix}`;
  }

  // If the user already included a single-letter middle initial (e.g., "Mark Andrie A. Cantara"),
  // use the first given name's initial + the explicit middle initial(s) -> "M. A. Cantara".
  // Otherwise convert each given/middle token to its initial -> "M. A. Cantara".
  const hasExplicitInitial = givenTokens.some((t) => /^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(t));

  let initialsTokens: string[];
  if (hasExplicitInitial && givenTokens.length > 2) {
    const firstInitial = `${givenTokens[0].charAt(0).toUpperCase()}.`;
    const explicitInitials = givenTokens
      .slice(1)
      .filter((t) => /^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(t))
      .map((t) => `${t.charAt(0).toUpperCase()}.`);
    initialsTokens = [firstInitial, ...explicitInitials];
  } else {
    initialsTokens = givenTokens
      .map((t) => {
        const ch = t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").charAt(0);
        return ch ? `${ch.toUpperCase()}.` : "";
      })
      .filter(Boolean);
  }

  if (initialsTokens.length === 0) {
    return `${surname}${suffix}`;
  }

  return `${initialsTokens.join(" ")} ${surname}${suffix}`;
}

