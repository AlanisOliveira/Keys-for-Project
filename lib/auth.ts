export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function cpfToInternalEmail(cpf: string) {
  return `${normalizeCpf(cpf)}@vault.local`;
}
