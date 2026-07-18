import type { Property } from "@/domain/types";

const shortDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(new Date(value));
}

export function formatShortDateTime(value: string) {
  return shortDateTimeFormatter.format(new Date(value));
}

export function formatPropertyAddressComplete(property: Property) {
  const street = `${property.address}, ${property.number}`;
  const complement = property.complement ? ` · ${property.complement}` : "";
  return `${street}${complement} · ${property.neighborhood} · ${property.city}/${property.state}`;
}

export function formatPropertyLabelComplete(property: Property) {
  return `${property.type} · ${formatPropertyAddressComplete(property)}`;
}

export function formatPropertyAddressCompact(property: Property) {
  const complement = property.complement ? `, ${property.complement}` : "";
  return `${property.address}, ${property.number}${complement} · ${property.city}/${property.state}`;
}

export function formatPropertyLabelCompact(property: Property) {
  const complement = property.complement ? ` · ${property.complement}` : "";
  return `${property.type} · ${property.address}, ${property.number}${complement} · ${property.city}/${property.state}`;
}
