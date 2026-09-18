export type AdminRoutingDomain = {
	id: string;
	hostname: string;
	status: string;
	routingEnabled: boolean;
};

export type AdminRoutingDomainsResponse = {
	domains: AdminRoutingDomain[];
};
