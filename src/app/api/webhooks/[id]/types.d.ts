export type WebhookRouteParams = {
	params: Promise<{ id: string }>;
};

export type WebhookDeliveryRouteParams = {
	params: Promise<{ id: string; deliveryId: string }>;
};
