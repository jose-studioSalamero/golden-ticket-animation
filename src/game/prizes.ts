export type Prize = "golden" | "discount";

export const PRIZE_COPY: Record<
  Prize,
  {
    heading: string;
    ticketTitle: string;
    ticketNote: string;
    ticketPlace: string;
    bannerTitle: string;
    bannerBody: string;
  }
> = {
  golden: {
    heading: "CONGRATULATIONS!",
    ticketTitle: "GOLDEN TICKET",
    ticketNote: "THREE TAPS\nADMIT ONE",
    ticketPlace: "THE COCOA VAULT\nGRAND DRAWING",
    bannerTitle: "GRAND PRIZE",
    bannerBody:
      "You found the Golden Ticket. Three taps unwrapped a Goldleaf bar — and one extraordinary prize.",
  },
  discount: {
    heading: "A SWEET TREAT",
    ticketTitle: "5% OFF TICKETS",
    ticketNote: "THREE TAPS\nKEEP THIS BAR",
    ticketPlace: "GOLDLEAF HOUSE\nCONSOLATION",
    bannerTitle: "CONSOLATION PRIZE",
    bannerBody: "This bar holds 5% off your tickets — a little Goldleaf to take home.",
  },
};
