import { customType } from "drizzle-orm/pg-core";
import { encryptField, decryptField } from "@ostentaculus/security/crypto";

/**
 * Transparent encrypted text column: plaintext in app code, AES-256-GCM
 * ciphertext at rest. Use for PII (users.phone), lead contacts, sensitive POS.
 * NOTE: encrypted columns are not searchable — keep a separate pseudonymized
 * hash for lookups/joins (see core/concierge/pii.ts).
 */
export const encryptedText = customType<{ data: string; driverData: string }>({
  dataType: () => "text",
  toDriver: (value) => encryptField(value),
  fromDriver: (value) => decryptField(value),
});
