import React, { useState, useEffect } from 'react';
import './css/ShipmentsPage.less';

const ShipmentsPage = () => {
	const [pageData, setPageData] = useState({
		top_text: '',
		bottom_text: '',
		products: []
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPageData = async () => {
			try {
				const response = await fetch('/api/pages/shipments');
				const data = await response.json();
				if (data.success) {
					setPageData({
						top_text: data.top_text || '',
						bottom_text: data.bottom_text || '',
						products: data.products || []
					});
				}
			} catch (error) {
				console.error('Error loading page data:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchPageData();
	}, []);

	if (loading) {
		return <div className="shipments-page loading">Загрузка...</div>;
	}

	const products = Array.isArray(pageData.products) ? pageData.products : [];

	return (
		<main className="shipments-page">
			<div className="shipments-page__container">
				{pageData.top_text && (
					<section className="shipments-page__top-text">
						<h1 className="shipments-page__headline">{pageData.top_text}</h1>
					</section>
				)}

				{products.length > 0 && (
					<section className="shipments-page__products">
						{products.map((product, index) => {
							const prices = Array.isArray(product.prices) ? product.prices : [];
							const imageSrc =
								product.image_path && product.image_path.trim()
									? product.image_path
									: 'https://via.placeholder.com/800x450/0b0b0b/ffffff?text=Product+image';

							return (
								<article key={product.id || index} className="shipments-page__product">
									<div className="shipments-page__product-media">
										<div className="shipments-page__product-image-wrapper">
											<img
												src={imageSrc}
												alt={product.name || 'Товар'}
												className="shipments-page__product-image"
												onError={(e) => {
													e.currentTarget.src =
														'https://via.placeholder.com/800x450/0b0b0b/ffffff?text=Product+image';
												}}
											/>
										</div>
									</div>
									<div className="shipments-page__product-body">
										{product.name && (
											<h2 className="shipments-page__product-title">{product.name}</h2>
										)}
										{product.description && (
											<p className="shipments-page__product-description">
												{product.description}
											</p>
										)}
										{prices.length > 0 && (
											<div className="shipments-page__product-prices">
												<div className="shipments-page__product-prices-header">
													<span>Вес</span>
													<span>Цена</span>
												</div>
												<div className="shipments-page__product-prices-body">
													{prices.map((price, pIndex) => (
														<div
															key={pIndex}
															className="shipments-page__product-price-row"
														>
															<span className="shipments-page__product-price-weight">
																{price.weight || '—'}
															</span>
															<span className="shipments-page__product-price-dots" aria-hidden="true" />
															<span className="shipments-page__product-price-value">
																{price.price || '—'}
															</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</article>
							);
						})}
					</section>
				)}

				{pageData.bottom_text && (
					<section className="shipments-page__bottom-text">
						<div className="shipments-page__bottom-text-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24" className="shipments-page__bottom-text-icon-svg">
								<path
									fill="none"
									stroke="currentColor"
									strokeWidth="1.7"
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
								/>
								<path
									fill="none"
									stroke="currentColor"
									strokeWidth="1.7"
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m4 8 8 5 8-5"
								/>
							</svg>
						</div>
						<div
							className="shipments-page__bottom-text-content"
							dangerouslySetInnerHTML={{ __html: pageData.bottom_text }}
						/>
					</section>
				)}
			</div>
		</main>
	);
};

export default ShipmentsPage;
