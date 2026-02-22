import React, { useState, useEffect, useMemo } from 'react';

import calculatorContentImage1 from '../../../../assets/img/work/calculator/calculator-img-1.png';
import calculatorContentImage2 from '../../../../assets/img/work/calculator/calculator-img-2.png';
import calculatorContentImage3 from '../../../../assets/img/work/calculator/calculator-img-3.png';
import calculatorContentImage4 from '../../../../assets/img/work/calculator/calculator-img-4.png';
import calculatorContentImage5 from '../../../../assets/img/work/calculator/calculator-img-5.png';
import calculatorContentImage6 from '../../../../assets/img/work/calculator/calculator-img-6.png';
import calculatorContentImage7 from '../../../../assets/img/work/calculator/calculator-img-7.png';
import { getPrices } from './utils/getPrices';
import LazyImageWithPreloader from '../../../../modules/LazyImageWithPreloader/LazyImageWithPreloader';
import SelectContainerModule from '../../../../modules/SelectContainerModule/SelectContainerModule';

const LOGISTICS_TOTAL_WEIGHT_OPTIONS = [10, 20, 30, 50, 100, 250];

const CARRIER_PRICES = {
	withWeightPerDay: 800,
	withoutWeightPerDay: 500,
};

const CITY_OPTIONS = [
	{ id: 'Moscow', label: 'Москва' },
	{ id: 'SPB', label: 'СПБ' },
];

const PRODUCT_TYPE_OPTIONS = [
	{ id: 'non_magnetic', label: 'Не магнит' },
	{ id: 'magnetic', label: 'Магнит' },
	{ id: 'magnetic_center', label: 'Магнит в центре' },
	{ id: 'nutra', label: 'Нутра' },
];

const LOGISTICS_WEIGHT_OPTIONS = LOGISTICS_TOTAL_WEIGHT_OPTIONS.map((weight) => ({
	id: String(weight),
	label: `${weight} г`,
}));

const Calculator = () => {
	const [selectedRole, setSelectedRole] = useState('deliveryman');
	const [prices, setPrices] = useState(null);

	const [deliverymanState, setDeliverymanState] = useState({
		city: null,
		productType: null,
		size: null,
		parcelsPerDay: 30,
		daysPerMonth: 30,
	});

	const [PackagesConfig] = useState([
		{
			id: 'p10',
			label: 'По 10 грамм',
			weight: 10,
			pricePerPackage: 2100,
		},
		{
			id: 'p20',
			label: 'По 20 грамм',
			weight: 20,
			pricePerPackage: 3600,
		},
		{
			id: 'p30',
			label: 'По 30 грамм',
			weight: 30,
			pricePerPackage: 5100,
		},
	]);

	const [logisticsState, setLogisticsState] = useState({
		selectedWeight: null,
		totalWeight: null,
		inputs: PackagesConfig.reduce((acc, pkg) => ({ ...acc, [pkg.weight]: '0' }), {}),
	});

	const [carrierState, setCarrierState] = useState({
		withWeightPerDay: 100,
		withoutWeightPerDay: 0,
	});

	const selectedCity = deliverymanState.city;
	const selectedProductType = deliverymanState.productType;
	const selectedSize = deliverymanState.size;
	const parcelsPerDay = deliverymanState.parcelsPerDay;
	const daysPerMonth = deliverymanState.daysPerMonth;
	const selectedLogisticsWeight = logisticsState.selectedWeight;
	const logisticsTotalWeight = logisticsState.totalWeight;
	const logisticsInputs = logisticsState.inputs;
	const carrierWithWeightPerDay = carrierState.withWeightPerDay;
	const carrierWithoutWeightPerDay = carrierState.withoutWeightPerDay;

	useEffect(() => {
		const loadPrices = async () => {
			try {
				const pricesData = await getPrices(selectedRole);
				setPrices(pricesData);
			} catch (error) {
				console.error('Ошибка при загрузке расценок:', error);
			}
		};

		loadPrices();
	}, [selectedRole]);

	const allSizesForCity = useMemo(() => {
		if (!prices || !selectedCity || !prices[selectedCity.id]) {
			return [];
		}

		const cityPrices = prices[selectedCity.id];
		const allSizes = new Set();

		if (cityPrices.nutra) {
			Object.keys(cityPrices.nutra).forEach((size) => allSizes.add(size));
		}

		if (cityPrices.weight) {
			Object.keys(cityPrices.weight).forEach((productType) => {
				if (cityPrices.weight[productType]) {
					Object.keys(cityPrices.weight[productType]).forEach((size) => allSizes.add(size));
				}
			});
		}

		return Array.from(allSizes).sort((a, b) => {
			const numA = parseFloat(a);
			const numB = parseFloat(b);
			return numA - numB;
		});
	}, [prices, selectedCity]);

	const availableSizes = useMemo(() => {
		if (!prices || !selectedCity || !selectedProductType || !prices[selectedCity.id]) {
			return [];
		}

		const cityPrices = prices[selectedCity.id];

		if (selectedProductType.id === 'nutra' && cityPrices.nutra) {
			return Object.keys(cityPrices.nutra).sort((a, b) => {
				const numA = parseFloat(a);
				const numB = parseFloat(b);
				return numA - numB;
			});
		}

		if (cityPrices.weight && cityPrices.weight[selectedProductType.id]) {
			return Object.keys(cityPrices.weight[selectedProductType.id]).sort((a, b) => {
				const numA = parseFloat(a);
				const numB = parseFloat(b);
				return numA - numB;
			});
		}

		return [];
	}, [prices, selectedCity, selectedProductType]);

	const validSize = useMemo(() => {
		if (!selectedSize || availableSizes.length === 0) {
			return null;
		}
		if (availableSizes.includes(selectedSize)) {
			return selectedSize;
		}
		return null;
	}, [availableSizes, selectedSize]);

	const income = useMemo(() => {
		if (selectedRole === 'logistics') {
			return PackagesConfig.reduce((sum, pkg) => {
				const count = Number(logisticsInputs[pkg.weight]) || 0;
				return sum + count * pkg.pricePerPackage;
			}, 0);
		}

		if (selectedRole === 'carrier') {
			const withWeightSteps = (carrierWithWeightPerDay - 100) / 10 + 1;
			const withWeightIncome = withWeightSteps * 100000;

			const withoutWeightSteps = carrierWithoutWeightPerDay / 10;
			const withoutWeightIncome = withoutWeightSteps * 2000;

			return withWeightIncome + withoutWeightIncome;
		}

		if (
			!prices ||
			!selectedCity ||
			!selectedProductType ||
			!validSize ||
			!prices[selectedCity.id]
		) {
			return 0;
		}

		const cityPrices = prices[selectedCity.id];
		let price = 0;

		if (selectedProductType.id === 'nutra' && cityPrices.nutra && cityPrices.nutra[validSize]) {
			price = cityPrices.nutra[validSize];
		} else if (
			cityPrices.weight &&
			cityPrices.weight[selectedProductType.id] &&
			cityPrices.weight[selectedProductType.id][validSize]
		) {
			price = cityPrices.weight[selectedProductType.id][validSize];
		}

		return price * parcelsPerDay * daysPerMonth;
	}, [
		selectedRole,
		selectedCity,
		selectedProductType,
		validSize,
		parcelsPerDay,
		daysPerMonth,
		prices,
		logisticsInputs,
		carrierWithWeightPerDay,
		carrierWithoutWeightPerDay,
		PackagesConfig,
	]);

	const handleRoleChange = (role) => {
		setSelectedRole(role);
	};

	const handleCityChange = (city) => {
		setDeliverymanState((prev) => ({
			...prev,
			city,
			productType: null,
			size: null,
		}));
	};

	const handleProductTypeChange = (productType) => {
		setDeliverymanState((prev) => ({
			...prev,
			productType,
			size: null,
		}));
	};

	const handleSizeChange = (size) => {
		setDeliverymanState((prev) => ({
			...prev,
			size,
		}));
	};

	const handleParcelsPerDayChange = (e) => {
		setDeliverymanState((prev) => ({
			...prev,
			parcelsPerDay: Number(e.target.value),
		}));
	};

	const handleDaysPerMonthChange = (e) => {
		setDeliverymanState((prev) => ({
			...prev,
			daysPerMonth: Number(e.target.value),
		}));
	};

	const handleLogisticsTotalWeightChange = (weight) => {
		if (weight) {
			setLogisticsState((prev) => ({
				...prev,
				selectedWeight: weight,
				totalWeight: Number(weight.id),
			}));
		} else {
			setLogisticsState((prev) => ({
				...prev,
				selectedWeight: null,
				totalWeight: null,
			}));
		}
	};

	const handleLogisticsInputChange = (portionWeight, value) => {
		const numericValue = Number(value);
		if (Number.isNaN(numericValue) || value === '') {
			setLogisticsState((prev) => ({
				...prev,
				inputs: { ...prev.inputs, [portionWeight]: '0' },
			}));
			return;
		}

		if (logisticsTotalWeight === null) {
			setLogisticsState((prev) => ({
				...prev,
				inputs: { ...prev.inputs, [portionWeight]: '0' },
			}));
			return;
		}

		const totalUsedWeight = PackagesConfig.reduce((sum, pkg) => {
			if (pkg.weight !== portionWeight) {
				const count = Number(logisticsInputs[pkg.weight]) || 0;
				return sum + count * pkg.weight;
			}
			return sum;
		}, 0);

		const remainingWeight = Math.max(0, logisticsTotalWeight - totalUsedWeight);
		const maxForCurrent = Math.floor(remainingWeight / portionWeight) || 0;
		const safeValue = Math.max(0, Math.min(numericValue, maxForCurrent));

		setLogisticsState((prev) => ({
			...prev,
			inputs: { ...prev.inputs, [portionWeight]: String(safeValue) },
		}));
	};

	const handleCarrierWithWeightPerDayChange = (e) => {
		setCarrierState((prev) => ({
			...prev,
			withWeightPerDay: Number(e.target.value),
		}));
	};

	const handleCarrierWithoutWeightPerDayChange = (e) => {
		setCarrierState((prev) => ({
			...prev,
			withoutWeightPerDay: Number(e.target.value),
		}));
	};

	const formatIncome = (value) => {
		return value.toLocaleString('ru-RU');
	};

	const outputImage = useMemo(() => {
		switch (selectedRole) {
			case 'logistics':
				return calculatorContentImage6;
			case 'carrier':
				return calculatorContentImage7;
			case 'deliveryman':
			default:
				return calculatorContentImage5;
		}
	}, [selectedRole]);

	return (
		<section className="calculator container">
			<div className="calculator__body">
				<ul className="calculator__body-list">
					<li className="calculator__body-list-item calculator__body-list-item--first">
						<h4 className="calculator__body-list-item-title">
							Обменник
							<br />
							специально
							<br />
							для сотрудников
						</h4>
						<p className="calculator__body-list-item-desc">
							Самый удобный и надежный вариант получить деньги в крипте и на карту
						</p>
						<LazyImageWithPreloader
							className="calculator__body-list-item-img"
							src={calculatorContentImage1}
							alt="content image of calculator description list item"
						/>
					</li>
					<li className="calculator__body-list-item calculator__body-list-item--second">
						<h4 className="calculator__body-list-item-title">
							Обучение
							<br />и поддержка
						</h4>
						<p className="calculator__body-list-item-desc">
							С нами можно быстрее и легче добиться высокой оплаты и результатов безопасно
						</p>
						<LazyImageWithPreloader
							className="calculator__body-list-item-img"
							src={calculatorContentImage2}
							alt="content image of calculator description list item"
						/>
					</li>
					<li className="calculator__body-list-item calculator__body-list-item--third">
						<LazyImageWithPreloader
							className="calculator__body-list-item-img"
							src={calculatorContentImage3}
							alt="content image of calculator description list item"
						/>
						<h3 className="calculator__body-list-item-title">По оплате</h3>
						<div className="calculator__body-list-item-features">
							<p className="calculator__body-list-item-features-item">
								Стабильно быстрые выплаты
								<span className="calculator__body-list-item-features-item-desc">
									Выплаты каждую неделю, а при необходимости выдаем аванс
								</span>
							</p>
							<p className="calculator__body-list-item-features-item">
								Платим за загруженные клады
								<span className="calculator__body-list-item-features-item-desc">
									Не нужно ждать, как клады продадутся, мы платим сразу
								</span>
							</p>
							<p className="calculator__body-list-item-features-item">
								Оплачиваем все расходы
								<span className="calculator__body-list-item-features-item-desc">
									Командировки, оплата, упаковка и оборудование — за всё платим мы
								</span>
							</p>
						</div>
					</li>
					<li className="calculator__body-list-item calculator__body-list-item--fourth">
						<h4 className="calculator__body-list-item-title">
							Хочешь накопить <br /> на цель и уйти?
						</h4>
						<p className="calculator__body-list-item-desc">
							Без проблем! Работай в своем темпе, сколько захочется
						</p>
						<a className="calculator__body-list-item-link" href=".">
							Откликнуться
						</a>
						<LazyImageWithPreloader
							className="calculator__body-list-item-img"
							src={calculatorContentImage4}
							alt="content image of calculator description list item"
						/>
					</li>

					<li
						id="calculator-income"
						className="calculator__body-list-item calculator__body-list-item--fifth">
						<div className="calculator__body-list-item-handle">
							<h2 className="calculator__body-list-item-handle-title">Узнай будущий доход</h2>
							<div className="calculator__body-list-item-handle-switchers">
								<button
									className={`calculator__body-list-item-handle-switchers-btn ${
										selectedRole === 'deliveryman' ? 'active' : ''
									}`}
									onClick={() => handleRoleChange('deliveryman')}>
									Курьер
								</button>
								<button
									className={`calculator__body-list-item-handle-switchers-btn ${
										selectedRole === 'logistics' ? 'active' : ''
									}`}
									onClick={() => handleRoleChange('logistics')}>
									Склад
								</button>
								<button
									className={`calculator__body-list-item-handle-switchers-btn ${
										selectedRole === 'carrier' ? 'active' : ''
									}`}
									onClick={() => handleRoleChange('carrier')}>
									Перевозчик
								</button>
							</div>

							{selectedRole === 'deliveryman' && (
								<>
									<div className="calculator__body-list-item-handle-product">
										<SelectContainerModule
											State={selectedCity}
											SetState={handleCityChange}
											DefaultText="Выберите город"
											Options={CITY_OPTIONS}
										/>
										<SelectContainerModule
											State={selectedProductType}
											SetState={handleProductTypeChange}
											DefaultText="Выберите тип"
											Options={PRODUCT_TYPE_OPTIONS}
											disabled={
												!selectedCity || (selectedCity.id !== 'Moscow' && selectedCity.id !== 'SPB')
											}
										/>
									</div>

									{allSizesForCity.length > 0 && (
										<div className="calculator__body-list-item-size">
											{allSizesForCity.map((size) => {
												const isAvailable = availableSizes.includes(size);
												const isDisabled = !selectedProductType || !isAvailable;
												return (
													<button
														key={size}
														className={`calculator__body-list-item-size-btn ${
															selectedSize === size ? 'active' : ''
														} ${isDisabled ? 'disabled' : ''}`}
														onClick={() => (!isDisabled ? handleSizeChange(size) : null)}
														disabled={isDisabled}>
														{size} гр
													</button>
												);
											})}
										</div>
									)}

									<div className="calculator__body-list-item-handle-sliders">
										<div className="calculator__body-list-item-handle-slider">
											<label className="calculator__body-list-item-handle-slider-label">
												Кладов в день
											</label>
											<div className="calculator__body-list-item-handle-slider-input-wrapper">
												<input
													type="range"
													min="0"
													max="30"
													value={parcelsPerDay}
													onChange={handleParcelsPerDayChange}
													className="calculator__body-list-item-handle-slider-input"
													style={{
														'--slider-progress': `${(parcelsPerDay / 30) * 100}%`,
													}}
												/>
												<span className="calculator__body-list-item-handle-slider-value">
													{parcelsPerDay}
												</span>
											</div>
										</div>
										<div className="calculator__body-list-item-handle-slider">
											<label className="calculator__body-list-item-handle-slider-label">
												Дней в месяц
											</label>
											<div className="calculator__body-list-item-handle-slider-input-wrapper">
												<input
													type="range"
													min="0"
													max="30"
													value={daysPerMonth}
													onChange={handleDaysPerMonthChange}
													className="calculator__body-list-item-handle-slider-input"
													style={{
														'--slider-progress': `${(daysPerMonth / 30) * 100}%`,
													}}
												/>
												<span className="calculator__body-list-item-handle-slider-value">
													{daysPerMonth}
												</span>
											</div>
										</div>
									</div>
								</>
							)}

							{selectedRole === 'logistics' && (
								<div className="calculator__body-list-item-handle-logistics">
									<div className="calculator__body-list-item-handle-logistics-select-wrapper">
										<SelectContainerModule
											State={selectedLogisticsWeight}
											SetState={handleLogisticsTotalWeightChange}
											DefaultText="Выберите вес"
											Options={LOGISTICS_WEIGHT_OPTIONS}
										/>
									</div>

									<div className="calculator__body-list-item-handle-logistics-list">
										{PackagesConfig.map((pkg) => {
											const totalUsedWeight = PackagesConfig.reduce((sum, p) => {
												if (p.weight !== pkg.weight) {
													const count = Number(logisticsInputs[p.weight]) || 0;
													return sum + count * p.weight;
												}
												return sum;
											}, 0);

											const freeWeight =
												logisticsTotalWeight !== null
													? Math.max(0, logisticsTotalWeight - totalUsedWeight)
													: 0;
											const available =
												logisticsTotalWeight !== null
													? Math.floor(freeWeight / pkg.weight) || 0
													: 0;
											const value = logisticsInputs[pkg.weight] ?? '0';

											return (
												<div
													key={pkg.id}
													className="calculator__body-list-item-handle-logistics-row">
													<div className="calculator__body-list-item-handle-logistics-row-info">
														<p className="calculator__body-list-item-handle-logistics-row-title">
															{pkg.label}
														</p>
														<p className="calculator__body-list-item-handle-logistics-row-available">
															{logisticsTotalWeight !== null
																? `Доступно ${available}`
																: 'Выберите вес'}
														</p>
													</div>
													<input
														type="number"
														className="calculator__body-list-item-handle-logistics-row-input"
														value={value}
														min="0"
														max={available}
														disabled={logisticsTotalWeight === null}
														onChange={(e) => handleLogisticsInputChange(pkg.weight, e.target.value)}
													/>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{selectedRole === 'carrier' && (
								<div className="calculator__body-list-item-handle-sliders">
									<div className="calculator__body-list-item-handle-slider">
										<label className="calculator__body-list-item-handle-slider-label">
											С весом в день
										</label>
										<div className="calculator__body-list-item-handle-slider-input-wrapper">
											<input
												type="range"
												min="100"
												max="2000"
												step="10"
												value={carrierWithWeightPerDay}
												onChange={handleCarrierWithWeightPerDayChange}
												className="calculator__body-list-item-handle-slider-input"
												style={{
													'--slider-progress': `${
														((carrierWithWeightPerDay - 100) / (2000 - 100)) * 100
													}%`,
												}}
											/>
											<span className="calculator__body-list-item-handle-slider-value">
												{carrierWithWeightPerDay}
											</span>
										</div>
									</div>
									<div className="calculator__body-list-item-handle-slider">
										<label className="calculator__body-list-item-handle-slider-label">
											Без веса
										</label>
										<div className="calculator__body-list-item-handle-slider-input-wrapper">
											<input
												type="range"
												min="0"
												max="2000"
												step="10"
												value={carrierWithoutWeightPerDay}
												onChange={handleCarrierWithoutWeightPerDayChange}
												className="calculator__body-list-item-handle-slider-input"
												style={{
													'--slider-progress': `${(carrierWithoutWeightPerDay / 2000) * 100}%`,
												}}
											/>
											<span className="calculator__body-list-item-handle-slider-value">
												{carrierWithoutWeightPerDay}
											</span>
										</div>
									</div>
								</div>
							)}

							<div className="toggler"></div>
						</div>
						<div className="calculator__body-list-item-output">
							<LazyImageWithPreloader
								className="calculator__body-list-item-output-img"
								src={outputImage}
								alt="content background image"
							/>
							{income !== 0 && (
								<div className="calculator__body-list-item-output-block">
									<p className="calculator__body-list-item-output-block-desc">
										Твой доход за месяц
									</p>
									<h2 className="calculator__body-list-item-output-block-val">
										<span className="calculator__body-list-item-output-block-val--num">
											{formatIncome(income)}
										</span>
										₽
									</h2>
								</div>
							)}
						</div>
					</li>
				</ul>
			</div>
		</section>
	);
};

export default Calculator;
