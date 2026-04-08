import { IQuery } from "@/api/src/shared/application";
import { WebhookEventFilterOptions } from "../../../domain/repositories/payment-webhook-event.repository";

export interface GetWebhookEventsQuery
  extends IQuery, WebhookEventFilterOptions {}
