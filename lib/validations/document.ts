import { z } from "zod";

export const documentSchema = z.object({
  name: z.string().min(2, "Le nom du document est requis"),
  type: z.enum(["CONTRACT", "INVOICE", "INSURANCE", "IDENTITY", "TAX", "OTHER"]),
  fileUrl: z.string().url("L'URL du fichier doit être valide"),
  description: z.string().optional(),
  expirationDate: z.string().optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;
