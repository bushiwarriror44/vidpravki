import React, { useState, useEffect } from 'react';
import './css/WholesalePage.less';

const WholesalePage = () => {
	const [pageData, setPageData] = useState({
		top_text: '',
		bottom_text: '',
		products: []
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPageData = async () => {
			try {
				const response = await fetch('/api/pages/wholesale');
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
		return <div className="wholesale-page loading">Загрузка...</div>;
	}

	const products = Array.isArray(pageData.products) ? pageData.products : [];

	return (
		<main className="wholesale-page">
			<div className="wholesale-page__container">
				{pageData.top_text && (
					<section className="wholesale-page__top-text">
						<div
							className="wholesale-page__headline"
							dangerouslySetInnerHTML={{ __html: pageData.top_text }}
						/>
					</section>
				)}

				{products.length > 0 && (
					<section className="wholesale-page__products">
						{products.map((product, index) => {
							const prices = Array.isArray(product.prices) ? product.prices : [];
							const imageSrc =
								product.image_path && product.image_path.trim()
									? product.image_path
									: 'https://via.placeholder.com/800x450/0b0b0b/ffffff?text=Wholesale+product';

							return (
								<article key={product.id || index} className="wholesale-page__product">
									<div className="wholesale-page__product-media">
										<div className="wholesale-page__product-image-wrapper">
											<img
												src={imageSrc}
												alt={product.name || 'Оптовый товар'}
												className="wholesale-page__product-image"
												onError={(e) => {
													e.currentTarget.src =
														'https://via.placeholder.com/800x450/0b0b0b/ffffff?text=Wholesale+product';
												}}
											/>
										</div>
									</div>
									<div className="wholesale-page__product-body">
										{product.name && (
											<h2 className="wholesale-page__product-title">{product.name}</h2>
										)}
										{product.description && (
											<p className="wholesale-page__product-description">
												{product.description}
											</p>
										)}
										{prices.length > 0 && (
											<div className="wholesale-page__product-prices">
												<div className="wholesale-page__product-prices-header">
													<span>Вес</span>
													<span>Цена</span>
												</div>
												<div className="wholesale-page__product-prices-body">
													{prices.map((price, pIndex) => (
														<div
															key={pIndex}
															className="wholesale-page__product-price-row"
														>
															<span className="wholesale-page__product-price-weight">
																{price.weight || '—'}
															</span>
															<span className="wholesale-page__product-price-dots" aria-hidden="true" />
															<span className="wholesale-page__product-price-value">
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
					<section className="wholesale-page__bottom-text">
						<div
							className="wholesale-page__bottom-text-content"
							dangerouslySetInnerHTML={{ __html: pageData.bottom_text }}
						/>
					</section>
				)}
			</div>
		</main>
	);
};

export default WholesalePage;
