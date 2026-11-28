export const legalVersion = "2026-11-27";

export const legalVersionLabel = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(legalVersion));
