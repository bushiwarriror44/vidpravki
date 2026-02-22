import React, { useState, useEffect } from 'react';
import './css/PromotionsPage.less';

const PromotionsPage = () => {
	const [pageData, setPageData] = useState({
		text: '',
		image_path: '',
		products: []
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPageData = async () => {
			try {
				const response = await fetch('/api/promotions');
				const data = await response.json();
				if (data.success) {
					setPageData({
						text: data.text || '',
						image_path: data.image_path || '',
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
		return <div className="promotions-page loading">Загрузка...</div>;
	}

	const products = Array.isArray(pageData.products) ? pageData.products : [];

	const hasHeroImage = Boolean(pageData.image_path && pageData.image_path.trim());

	return (
		<main className="promotions-page">
			<div className="promotions-page__container">
				{pageData.text && (
					<section className="promotions-page__text">
						<h1 className="promotions-page__headline">{pageData.text}</h1>
					</section>
				)}

				{hasHeroImage && (
					<section className="promotions-page__image">
						<div className="promotions-page__image-wrapper">
							<img
								src={pageData.image_path}
								alt="Акции и предложения"
								onError={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
						</div>
					</section>
				)}

				{products.length > 0 && (
					<section className="promotions-page__products">
						<h2 className="promotions-page__products-title">Товары по акциям</h2>
						<div className="promotions-page__products-list">
							{products.map((product, index) => {
								const prices = Array.isArray(product.prices) ? product.prices : [];
								const imageSrc =
									product.image_path && product.image_path.trim()
										? product.image_path
										: 'https://via.placeholder.com/640x360/0b0b0b/ffffff?text=Promo+product';

								return (
									<article key={product.id || index} className="promotions-page__product">
										<div className="promotions-page__product-media">
											<div className="promotions-page__product-image-wrapper">
												<img
													src={imageSrc}
													alt={product.name || 'Акционный товар'}
													className="promotions-page__product-image"
													onError={(e) => {
														e.currentTarget.src =
															'https://via.placeholder.com/640x360/0b0b0b/ffffff?text=Promo+product';
													}}
												/>
											</div>
										</div>
										<div className="promotions-page__product-body">
											{product.name && (
												<h3 className="promotions-page__product-title">{product.name}</h3>
											)}
											{product.description && (
												<p className="promotions-page__product-description">
													{product.description}
												</p>
											)}
											{prices.length > 0 && (
												<div className="promotions-page__product-prices">
													<div className="promotions-page__product-prices-header">
														<span>Вес</span>
														<span>Цена</span>
													</div>
													<div className="promotions-page__product-prices-body">
														{prices.map((price, pIndex) => (
															<div
																key={pIndex}
																className="promotions-page__product-price-row"
															>
																<span className="promotions-page__product-price-weight">
																	{price.weight || '—'}
																</span>
																<span className="promotions-page__product-price-dots" aria-hidden="true" />
																<span className="promotions-page__product-price-value">
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
						</div>
					</section>
				)}
			</div>
		</main>
	);
};

export default PromotionsPage;
