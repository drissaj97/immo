import { describe, expect, it } from "vitest";
import { listingAllowsDepositReservation } from "@/lib/listings/deposit-reservation";

describe("listingAllowsDepositReservation", () => {
  it("refuse les annonces Avito / Mubawab même en vente", () => {
    expect(
      listingAllowsDepositReservation({
        transactionType: "sale",
        status: "published",
        depositReservationEnabled: true,
        aggregationSource: "mubawab",
        isExternal: true,
        licenseStatus: "scraped",
      }),
    ).toBe(false);

    expect(
      listingAllowsDepositReservation({
        transactionType: "sale",
        status: "published",
        depositReservationEnabled: true,
        aggregationSource: "avito",
        isExternal: true,
      }),
    ).toBe(false);
  });

  it("refuse sans opt-in promoteur", () => {
    expect(
      listingAllowsDepositReservation({
        transactionType: "sale",
        status: "published",
        aggregationSource: "holding-immo",
        licenseStatus: "partner_contract",
        depositReservationEnabled: false,
      }),
    ).toBe(false);
  });

  it("autorise un promoteur / first-party avec opt-in public", () => {
    expect(
      listingAllowsDepositReservation({
        transactionType: "sale",
        status: "published",
        depositReservationEnabled: true,
        aggregationSource: "holding-immo",
        licenseStatus: "partner_contract",
      }),
    ).toBe(true);

    expect(
      listingAllowsDepositReservation({
        transactionType: "sale",
        status: "published",
        depositReservationEnabled: true,
        sourceType: "first_party",
        aggregationSource: "darbladi",
        isExternal: false,
      }),
    ).toBe(true);
  });

  it("refuse la location", () => {
    expect(
      listingAllowsDepositReservation({
        transactionType: "long_term_rent",
        status: "published",
        depositReservationEnabled: true,
        aggregationSource: "darbladi",
        sourceType: "first_party",
      }),
    ).toBe(false);
  });
});
