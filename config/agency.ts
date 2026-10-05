// Single place to swap the fictional agency for a real prospect.

export type OpeningHours = { open: string; close: string }; // "HH:mm", local agency time

export const agency = {
  name: "Atlas Voyages",
  city: "Casablanca",
  assistantName: "Salma",
  timezone: "Africa/Casablanca",
  // Retell agent locales. Darija is not supported by Retell; fr-FR is primary.
  languages: ["fr-FR"] as string[],
  // ISO weekday (1 = Monday ... 7 = Sunday). A missing day is closed.
  openingHours: {
    1: { open: "09:30", close: "18:00" },
    2: { open: "09:30", close: "18:00" },
    3: { open: "09:30", close: "18:00" },
    4: { open: "09:30", close: "18:00" },
    5: { open: "09:30", close: "18:00" },
    6: { open: "09:30", close: "18:00" },
  } as Partial<Record<number, OpeningHours>>,
  slotMinutes: 30,
  // A slot starting sooner than this is not offered, so the advisor has time to prepare.
  minLeadMinutes: 30,
  maxSlotsPerAnswer: 5,
  alternativeDays: 3,
  searchHorizonDays: 30,
  advisors: ["Yasmine Benali", "Karim Idrissi"],
};

export type AgencyConfig = typeof agency;
