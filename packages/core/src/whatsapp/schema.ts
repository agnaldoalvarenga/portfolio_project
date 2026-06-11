import { z } from "zod";

const locationMessage = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.literal("location"),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
});

const textMessage = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.literal("text"),
  text: z.object({ body: z.string().max(4096) }),
});

const otherMessage = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
});

export const inboundMessage = z.union([locationMessage, textMessage, otherMessage]);
export type InboundMessage = z.infer<typeof inboundMessage>;

export const metaWebhookBody = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      field: z.string(),
      value: z.object({
        messaging_product: z.literal("whatsapp"),
        metadata: z.object({ phone_number_id: z.string() }),
        messages: z.array(inboundMessage).optional(),
      }),
    })),
  })),
});
export type MetaWebhookBody = z.infer<typeof metaWebhookBody>;
