export function formatGuardianPhone(value: string) {
  const phone = value.trim();
  if (!/^\+?[\d ().-]*$/.test(phone)) return value;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return value;

  const explicitCountryCode = phone.startsWith("+");
  // Até 11 dígitos, 55 sem o sinal de + pode ser o DDD.
  const hasBrazilianCountryCode =
    digits.startsWith("55") && (explicitCountryCode || digits.length > 11);

  if (explicitCountryCode && !hasBrazilianCountryCode) return value;

  const local = hasBrazilianCountryCode ? digits.slice(2) : digits;
  if (local.length > 11) return value;

  const prefix = hasBrazilianCountryCode
    ? explicitCountryCode
      ? "+55"
      : "55"
    : "";
  const areaCode = local.slice(0, 2);
  const subscriber = local.slice(2);
  const start = prefix && local ? `${prefix} ` : prefix;
  if (!subscriber) return `${start}${areaCode}`;

  const firstGroupLength = subscriber.length === 9 ? 5 : 4;
  const firstGroup = subscriber.slice(0, firstGroupLength);
  const lastGroup = subscriber.slice(firstGroupLength);

  return `${start}(${areaCode}) ${firstGroup}${lastGroup ? `-${lastGroup}` : ""}`;
}
