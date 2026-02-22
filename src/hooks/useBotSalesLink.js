import GlobalStore from '../Stores/GlobalStore/GlobalStore';

export const useBotSalesLink = () => {
	const settings = GlobalStore((state) => state.settings);
	return settings?.contact_links?.bot_sales || '#';
};

