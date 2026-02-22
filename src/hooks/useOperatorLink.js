import GlobalStore from '../Stores/GlobalStore/GlobalStore';

export const useOperatorLink = () => {
	const settings = GlobalStore((state) => state.settings);
	return settings?.contact_links?.operator_telegram || '#';
};

