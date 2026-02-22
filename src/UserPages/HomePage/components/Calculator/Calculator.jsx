import { useState, useMemo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/Calculator.less';

gsap.registerPlugin(ScrollTrigger);

const Calculator = () => {
	const [cities, setCities] = useState([
		{
			name: 'Москва',
			products: [
				{ name: 'Яблоки', price: 900 },
				{ name: 'Груши', price: 900 },
				{ name: 'Апельсины', price: 900 },
			],
		},
	]);
	const [weeksPerMonth, setWeeksPerMonth] = useState(4.33);
	const [packingBonus, setPackingBonus] = useState(1100);
	const [chemistKgPrice, setChemistKgPrice] = useState(120000);
	const [carrierWithWeightPricePerStep, setCarrierWithWeightPricePerStep] = useState(100000);
	const [carrierWithoutWeightPricePerStep, setCarrierWithoutWeightPricePerStep] = useState(2000);
	const [settingsLoaded, setSettingsLoaded] = useState(false);
	const [position, setPosition] = useState('courier');
	const [daysValue, setDaysValue] = useState(6);
	const [depositsValue, setDepositsValue] = useState(6);
	const [chemistKg, setChemistKg] = useState(10);
	const [carrierWithWeightPerDay, setCarrierWithWeightPerDay] = useState(100);
	const [carrierWithoutWeightPerDay, setCarrierWithoutWeightPerDay] = useState(0);
	const [region, setRegion] = useState('Москва');
	const [product, setProduct] = useState('Яблоки');
	const [contactUsButtonLink, setContactUsButtonLink] = useState('#');
	const sectionRef = useRef(null);

	useEffect(() => {
		const fetchCalculatorSettings = async () => {
			try {
				const response = await fetch('/api/get_calculator_settings');
				if (response.ok) {
					const data = await response.json();
					if (data.cities && data.cities.length > 0) {
						setCities(data.cities);
						const currentRegionExists = data.cities.some((c) => c.name === region);
						if (!currentRegionExists) {
							setRegion(data.cities[0].name);
						}
						const selectedCity = data.cities.find(
							(c) => c.name === (currentRegionExists ? region : data.cities[0].name),
						);
						if (selectedCity && selectedCity.products && selectedCity.products.length > 0) {
							const currentProductExists = selectedCity.products.some((p) => p.name === product);
							if (!currentProductExists) {
								setProduct(selectedCity.products[0].name);
							}
						}
					}
					if (data.weeks_per_month) {
						setWeeksPerMonth(data.weeks_per_month);
					}
					if (data.packing_bonus !== undefined) {
						setPackingBonus(data.packing_bonus);
					}
					if (data.chemist_kg_price !== undefined) {
						setChemistKgPrice(data.chemist_kg_price);
					}
					if (data.carrier_with_weight_price_per_step !== undefined) {
						setCarrierWithWeightPricePerStep(data.carrier_with_weight_price_per_step);
					}
					if (data.carrier_without_weight_price_per_step !== undefined) {
						setCarrierWithoutWeightPricePerStep(data.carrier_without_weight_price_per_step);
					}
				}
			} catch (error) {
				console.error('Failed to fetch calculator settings:', error);
			} finally {
				setSettingsLoaded(true);
			}
		};

		fetchCalculatorSettings();
	}, [region, product]);

	useEffect(() => {
		const fetchContactUsButtonLink = async () => {
			try {
				const response = await fetch('/api/get_contact_us_button_link');
				if (response.ok) {
					const data = await response.json();
					if (data.link) {
						setContactUsButtonLink(data.link);
					}
				}
			} catch (error) {
				console.error('Failed to fetch contact us button link:', error);
			}
		};
		fetchContactUsButtonLink();
	}, []);
	const [packingBySelf, setPackingBySelf] = useState(false);
	const [activePreset, setActivePreset] = useState(null);
	const [activeHint, setActiveHint] = useState('product');

	const income = useMemo(() => {
		if (!settingsLoaded) {
			return { monthly: 0, weekly: 0 };
		}

		if (position === 'chemist') {
			const monthlyIncome = Math.round(chemistKg * chemistKgPrice);
			return {
				monthly: monthlyIncome,
				weekly: Math.round(monthlyIncome / weeksPerMonth),
			};
		}

		if (position === 'transporter') {
			const withWeightSteps = (carrierWithWeightPerDay - 100) / 10 + 1;
			const withWeightIncome = withWeightSteps * carrierWithWeightPricePerStep;
			const withoutWeightSteps = carrierWithoutWeightPerDay / 10;
			const withoutWeightIncome = withoutWeightSteps * carrierWithoutWeightPricePerStep;
			const monthlyIncome = Math.round(withWeightIncome + withoutWeightIncome);
			return {
				monthly: monthlyIncome,
				weekly: Math.round(monthlyIncome / weeksPerMonth),
			};
		}

		const selectedCity = cities.find((c) => c.name === region);
		let productPrice = 900; // Значение по умолчанию

		if (selectedCity && selectedCity.products) {
			const cityProduct = selectedCity.products.find((p) => p.name === product);
			if (cityProduct) {
				productPrice = cityProduct.price;
			} else if (selectedCity.products.length > 0) {
				productPrice = selectedCity.products[0].price;
			}
		}

		if (packingBySelf) {
			productPrice += packingBonus;
		}

		const dailyIncome = productPrice * depositsValue;
		const monthlyIncome = dailyIncome * daysValue;
		const weeklyIncome = Math.round(monthlyIncome / weeksPerMonth);
		return {
			monthly: monthlyIncome,
			weekly: weeklyIncome,
		};
	}, [
		daysValue,
		depositsValue,
		product,
		position,
		cities,
		region,
		weeksPerMonth,
		settingsLoaded,
		packingBySelf,
		packingBonus,
		chemistKg,
		chemistKgPrice,
		carrierWithWeightPerDay,
		carrierWithoutWeightPerDay,
		carrierWithWeightPricePerStep,
		carrierWithoutWeightPricePerStep,
	]);

	const formatNumber = (num) => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	};

	const setPresetIncome = (targetIncome) => {
		if (!settingsLoaded) return;

		if (position === 'chemist') {
			const kg = Math.min(50, Math.max(1, Math.round(targetIncome / chemistKgPrice)));
			setChemistKg(kg);
			setActivePreset(targetIncome);
			return;
		}

		if (position === 'transporter') {
			const withWeightSteps = Math.max(0, (carrierWithWeightPerDay - 100) / 10 + 1);
			const currentWith = withWeightSteps * carrierWithWeightPricePerStep;
			if (targetIncome <= currentWith) {
				const steps = Math.max(0, Math.floor(targetIncome / carrierWithWeightPricePerStep));
				const dayVal = 100 + (steps - 1) * 10;
				setCarrierWithWeightPerDay(Math.min(2000, Math.max(100, dayVal)));
				setCarrierWithoutWeightPerDay(0);
			} else {
				const rest = targetIncome - currentWith;
				const steps = Math.floor(rest / carrierWithoutWeightPricePerStep);
				setCarrierWithoutWeightPerDay(Math.min(2000, Math.max(0, steps * 10)));
			}
			setActivePreset(targetIncome);
			return;
		}

		{
			const selectedCity = cities.find((c) => c.name === region);
			let productPrice = 900;

			if (selectedCity && selectedCity.products) {
				const cityProduct = selectedCity.products.find((p) => p.name === product);
				if (cityProduct) {
					productPrice = cityProduct.price;
				} else if (selectedCity.products.length > 0) {
					productPrice = selectedCity.products[0].price;
				}
			}

			if (packingBySelf) {
				productPrice += packingBonus;
			}

			const maxIncome = productPrice * 100 * 30;

			if (targetIncome >= maxIncome) {
				setDaysValue(30);
				setDepositsValue(100);
				setActivePreset(targetIncome);
				return;
			}

			let calculatedDeposits = Math.ceil(targetIncome / (productPrice * 30));

			if (calculatedDeposits > 100) {
				calculatedDeposits = 100;
				const calculatedDays = Math.ceil(targetIncome / (productPrice * calculatedDeposits));
				setDaysValue(Math.min(Math.max(calculatedDays, 1), 30));
			} else {
				setDaysValue(30);
			}

			setDepositsValue(Math.min(Math.max(calculatedDeposits, 1), 100));
			setActivePreset(targetIncome);
		}
	};

	const handlePresetClick = (incomeString) => {
		const income = parseInt(incomeString.replace(/\s/g, '').replace('₽', ''));
		setPresetIncome(income);
	};

	useEffect(() => {
		const section = sectionRef.current;
		if (!section || !settingsLoaded) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				section.querySelector('.calculator__header'),
				{ opacity: 0, y: 30 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: section,
						start: 'top 80%',
						toggleActions: 'play none none none',
					},
				},
			);

			gsap.fromTo(
				section.querySelector('.calculator__body'),
				{ opacity: 0, y: 40 },
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: 'power3.out',
					delay: 0.2,
					scrollTrigger: {
						trigger: section.querySelector('.calculator__body'),
						start: 'top 85%',
						toggleActions: 'play none none none',
					},
				},
			);
		}, section);

		return () => ctx.revert();
	}, [settingsLoaded]);

	return (
		<section className="calculator" ref={sectionRef} id="calculator">
			<div className="calculator__header">
				<h2 className="calculator__header-title">Калькулятор дохода</h2>
				<p className="calculator__header-text">
					Вы с легкостью сможете рассчитать свой примерный заработок <br /> исходя из своей
					загруженности.
				</p>
			</div>
			<div className="calculator__body">
				<div className="calculator__body-inner">
					<div className="calculator__body-header">
						<p className="calculator__body-header-text">Выберите должность</p>
						<ul className="calculator__body-header-options">
							<li
								className={`calculator__body-header-options-item ${position === 'courier' ? 'active' : ''} calculator__body-header-options-item--courier`}
								onClick={() => {
									setPosition('courier');
									setActivePreset(null);
								}}>
								Курьер
							</li>
							<li
								className={`calculator__body-header-options-item ${position === 'chemist' ? 'active' : ''} calculator__body-header-options-item--courier`}
								onClick={() => {
									setPosition('chemist');
									setActivePreset(null);
								}}>
								Химик
							</li>
							<li
								className={`calculator__body-header-options-item ${position === 'transporter' ? 'active' : ''} calculator__body-header-options-item--driver`}
								onClick={() => {
									setPosition('transporter');
									setActivePreset(null);
								}}>
								Перевозчик
							</li>
						</ul>
					</div>
					{position === 'chemist' ? (
						<div className="calculator__body-handle">
							<div className="calculator__body-handle-block calculator__body-handle-block--region">
								<div className="calculator__body-handle-block-input">
									<p className="calculator__body-handle-block-input-label">Сколько готов варить?</p>
									<p className="calculator__body-handle-block-hint-desc" style={{ marginTop: 8 }}>
										Выберите объём (1–50 кг). Доход: цена за 1 кг × выбранный объём.
									</p>
								</div>
							</div>
						</div>
					) : position === 'transporter' ? (
						<div className="calculator__body-handle">
							<div className="calculator__body-handle-block calculator__body-handle-block--region">
								<div className="calculator__body-handle-block-input">
									<p className="calculator__body-handle-block-hint-desc">
										Доход перевозчика: за рейсы с весом (шаг 10 от 100) и за рейсы без веса (шаг
										10). Цены за шаг задаются в админке.
									</p>
								</div>
							</div>
						</div>
					) : (
						<div className="calculator__body-handle">
							<div className="calculator__body-handle-block calculator__body-handle-block--region">
								<div className="calculator__body-handle-block-input">
									<p className="calculator__body-handle-block-input-label">Выберите регион</p>
									<select
										className="calculator__body-handle-block-input-select"
										name="region"
										id="region-select"
										value={region}
										onChange={(e) => {
											const newRegion = e.target.value;
											setRegion(newRegion);
											const selectedCity = cities.find((c) => c.name === newRegion);
											if (
												selectedCity &&
												selectedCity.products &&
												selectedCity.products.length > 0
											) {
												const currentProductExists = selectedCity.products.some(
													(p) => p.name === product,
												);
												if (!currentProductExists) {
													setProduct(selectedCity.products[0].name);
												}
											}
											setActivePreset(null);
										}}>
										{cities.map((city) => (
											<option key={city.name} value={city.name}>
												{city.name}
											</option>
										))}
									</select>
									<div
										className={`calculator__body-handle-block-hint ${activeHint === 'region' ? 'active' : ''} ${position === 'courier' ? 'courier' : ''}`}
										onClick={() => setActiveHint('region')}>
										<p className="calculator__body-handle-block-hint-heading">Магнит, тайник</p>
										<span className="calculator__body-handle-block-hint-desc">
											Эти клады создаются в городской зоне. Магнит цепляют на металлические
											конструкции, а тайник прячут в укромное место.
										</span>
									</div>
								</div>
							</div>
							<div className="calculator__body-handle-block calculator__body-handle-block--product">
								<div className="calculator__body-handle-block-input">
									<p className="calculator__body-handle-block-input-label">Выберите позицию</p>
									<select
										className="calculator__body-handle-block-input-select"
										name="product"
										id="product-select"
										value={product}
										onChange={(e) => {
											setProduct(e.target.value);
											setActivePreset(null);
										}}>
										{(() => {
											const selectedCity = cities.find((c) => c.name === region);
											const cityProducts =
												selectedCity && selectedCity.products ? selectedCity.products : [];
											return cityProducts.map((prod) => (
												<option key={prod.name} value={prod.name}>
													{prod.name}
												</option>
											));
										})()}
									</select>
									<div
										className={`calculator__body-handle-block-hint ${activeHint === 'product' ? 'active' : ''} ${position === 'courier' ? 'courier' : ''}`}
										onClick={() => setActiveHint('product')}>
										<p className="calculator__body-handle-block-hint-heading">Прикоп</p>
										<span className="calculator__body-handle-block-hint-desc">
											Эти клады создаются в пригородной зоне. Прикоп закапывают в землю в
											немноголюдных местах, например, в парках или лесах.
										</span>
									</div>
								</div>
							</div>
						</div>
					)}
					{position === 'chemist' ? (
						<div className="calculator__body-switchers">
							<div className="calculator__body-switchers-item">
								<p className="calculator__body-switchers-item-header">Сколько готов варить? (кг)</p>
								<div className="calculator__body-switchers-item-slider">
									<div
										className="calculator__body-switchers-item-slider-tooltip"
										style={{ left: `${((chemistKg - 1) / 49) * 100}%` }}>
										{chemistKg}
									</div>
									<input
										type="range"
										min="1"
										max="50"
										value={chemistKg}
										onChange={(e) => {
											setChemistKg(Number(e.target.value));
											setActivePreset(null);
										}}
										className="calculator__body-switchers-item-slider-input"
										style={{ '--slider-progress': `${((chemistKg - 1) / 49) * 100}%` }}
									/>
								</div>
							</div>
						</div>
					) : position === 'transporter' ? (
						<div className="calculator__body-switchers">
							<div className="calculator__body-switchers-item">
								<p className="calculator__body-switchers-item-header">С весом в день</p>
								<div className="calculator__body-switchers-item-slider">
									<div
										className="calculator__body-switchers-item-slider-tooltip"
										style={{ left: `${((carrierWithWeightPerDay - 100) / 1900) * 100}%` }}>
										{carrierWithWeightPerDay}
									</div>
									<input
										type="range"
										min="100"
										max="2000"
										step="10"
										value={carrierWithWeightPerDay}
										onChange={(e) => {
											setCarrierWithWeightPerDay(Number(e.target.value));
											setActivePreset(null);
										}}
										className="calculator__body-switchers-item-slider-input"
										style={{
											'--slider-progress': `${((carrierWithWeightPerDay - 100) / 1900) * 100}%`,
										}}
									/>
								</div>
							</div>
							<div className="calculator__body-switchers-item">
								<p className="calculator__body-switchers-item-header">Без веса</p>
								<div className="calculator__body-switchers-item-slider">
									<div
										className="calculator__body-switchers-item-slider-tooltip"
										style={{ left: `${(carrierWithoutWeightPerDay / 2000) * 100}%` }}>
										{carrierWithoutWeightPerDay}
									</div>
									<input
										type="range"
										min="0"
										max="2000"
										step="10"
										value={carrierWithoutWeightPerDay}
										onChange={(e) => {
											setCarrierWithoutWeightPerDay(Number(e.target.value));
											setActivePreset(null);
										}}
										className="calculator__body-switchers-item-slider-input"
										style={{ '--slider-progress': `${(carrierWithoutWeightPerDay / 2000) * 100}%` }}
									/>
								</div>
							</div>
						</div>
					) : (
						<div className="calculator__body-switchers">
							<div className="calculator__body-switchers-item">
								<p className="calculator__body-switchers-item-header">
									Сколько дней планируешь работать
								</p>
								<div className="calculator__body-switchers-item-slider">
									<div
										className="calculator__body-switchers-item-slider-tooltip"
										style={{ left: `${((daysValue - 0.9) / 29) * 100}%` }}>
										{daysValue}
									</div>
									<input
										type="range"
										min="1"
										max="30"
										value={daysValue}
										onChange={(e) => {
											setDaysValue(Number(e.target.value));
											setActivePreset(null);
										}}
										className="calculator__body-switchers-item-slider-input"
										style={{ '--slider-progress': `${((daysValue - 1) / 29) * 100}%` }}
									/>
								</div>
							</div>
							<div className="calculator__body-switchers-item">
								<p className="calculator__body-switchers-item-header">Количество кладов в день</p>
								<div className="calculator__body-switchers-item-slider">
									<div
										className="calculator__body-switchers-item-slider-tooltip"
										style={{ left: `${((depositsValue - 0.9) / 99) * 100}%` }}>
										{depositsValue}
									</div>
									<input
										type="range"
										min="1"
										max="100"
										value={depositsValue}
										onChange={(e) => {
											setDepositsValue(Number(e.target.value));
											setActivePreset(null);
										}}
										className="calculator__body-switchers-item-slider-input"
										style={{ '--slider-progress': `${((depositsValue - 1) / 99) * 100}%` }}
									/>
								</div>
							</div>
							<div className="calculator__body-switchers-item-check">
								<input
									type="checkbox"
									name="packing_byself"
									id="packing-checkbox"
									checked={packingBySelf}
									onChange={(e) => setPackingBySelf(e.target.checked)}
								/>
								<div className="calculator__body-switchers-item-check-text">
									<p className="calculator__body-switchers-item-check-text-heading">
										Сам займусь фасовкой
									</p>
									<span className="calculator__body-switchers-item-check-text-heading">
										Оплата будет выше
									</span>
								</div>
							</div>
						</div>
					)}

					<div className="calculator__body-output">
						<h3 className="calculator__body-output-title">Возможный доход</h3>
						<div className="calculator__body-output-screen">
							<p className="calculator__body-output-screen-block" id="month-block-calculator">
								<span className="calculator__body-output-screen-block-sum">
									{formatNumber(income.monthly)}
								</span>
								<span className="calculator__body-output-screen-block-currency">₽</span>
								за месяц
							</p>
							<p className="calculator__body-output-screen-block" id="week-block-calculator">
								<span className="calculator__body-output-screen-block-sum">
									{formatNumber(income.weekly)}
								</span>
								<span className="calculator__body-output-screen-block-currency">₽</span>
								за неделю
							</p>
						</div>
						<div className="calculator__body-output-preset">
							<span className="calculator__body-output-preset-caption">
								Или выберите желаемый доход
							</span>
							<div className="calculator__body-output-preset-buttons">
								<button
									className={`calculator__body-output-preset-buttons-item ${activePreset === 100000 ? 'active' : ''}`}
									onClick={() => handlePresetClick('100 000₽')}>
									100 000₽
								</button>
								<button
									className={`calculator__body-output-preset-buttons-item ${activePreset === 250000 ? 'active' : ''}`}
									onClick={() => handlePresetClick('250 000₽')}>
									250 000₽
								</button>
								<button
									className={`calculator__body-output-preset-buttons-item ${activePreset === 300000 ? 'active' : ''}`}
									onClick={() => handlePresetClick('300 000₽')}>
									300 000₽
								</button>
								<button
									className={`calculator__body-output-preset-buttons-item ${activePreset === 550000 ? 'active' : ''}`}
									onClick={() => handlePresetClick('550 000₽')}>
									550 000₽
								</button>
								<button
									className={`calculator__body-output-preset-buttons-item ${activePreset === 700000 ? 'active' : ''}`}
									onClick={() => handlePresetClick('700 000₽')}>
									700 000₽
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="footer__content">
				<h3 className="footer__title">Надежный формат работы</h3>
				<p className="footer__text">
					vidpravki - это команда с системным подходом, понятными этапами и поддержкой на каждом
					шаге. Мы делаем процессы прозрачными и удобными, чтобы вы могли сосредоточиться на
					результате.
				</p>
				<p className="footer__text footer__text--muted">
					Перед любыми действиями обязательно проверяйте актуальные контакты и рабочие ссылки только
					в официальных источниках.
				</p>
				<p className="footer__note">Работаем аккуратно, последовательно и на результат.</p>
			</div>
			<div className="contact-us__content">
				<h3 className="contact-us__title">Напиши нам</h3>
				<p className="contact-us__text">
					Ты еще не в нашей команде ? Начинай зарабатывать и рости вместе с нами, вместе с vidpravki
					. Пиши по контакту ниже и связывайся с нами, чтобы начать .
				</p>
				<a href={contactUsButtonLink} className="contact-us__button">
					Вступить в команду
				</a>
			</div>
		</section>
	);
};

export default Calculator;
