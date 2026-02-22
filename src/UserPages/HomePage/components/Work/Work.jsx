import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/Work.less';

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
	const [cards, setCards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const sectionRef = useRef(null);
	const listRef = useRef(null);
	const infoBlocks = [
		{
			title: 'Прозрачный старт',
			text: 'Пошаговое введение в процессы, понятные задачи и поддержка на этапе адаптации.',
		},
		{
			title: 'Стабильные выплаты',
			text: 'Фиксированная оплата, дополнительные премии и прозрачные условия роста внутри команды.',
		},
		{
			title: 'Развитие в системе',
			text: 'Регулярная обратная связь, усиление навыков и возможность двигаться к более сильным ролям.',
		},
	];

	const renderInfoBlocks = () => (
		<div className="work__info">
			{infoBlocks.map((block) => (
				<div key={block.title} className="work__info-item">
					<h3 className="work__info-item-title">{block.title}</h3>
					<p className="work__info-item-text">{block.text}</p>
				</div>
			))}
		</div>
	);

	useEffect(() => {
		const fetchWorkCards = async () => {
			try {
				const response = await fetch('/api/get_work_cards');
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				if (data.cards) {
					setCards(data.cards);
				} else {
					setCards([]);
				}
			} catch (e) {
				console.error('Failed to fetch work cards:', e);
				setError('Не удалось загрузить карточки работы.');
			} finally {
				setLoading(false);
			}
		};

		fetchWorkCards();
	}, []);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section || loading || cards.length === 0) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				section.querySelector('.work__title'),
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
				section.querySelectorAll('.work__desc-text'),
				{ opacity: 0, y: 20 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power3.out',
					stagger: 0.1,
					scrollTrigger: {
						trigger: section,
						start: 'top 80%',
						toggleActions: 'play none none none',
					},
				},
			);

			if (listRef.current) {
				gsap.fromTo(
					listRef.current.children,
					{ opacity: 0, y: 40, scale: 0.95 },
					{
						opacity: 1,
						y: 0,
						scale: 1,
						duration: 0.6,
						ease: 'power2.out',
						stagger: 0.15,
						scrollTrigger: {
							trigger: listRef.current,
							start: 'top 85%',
							toggleActions: 'play none none none',
						},
					},
				);
			}
		}, section);

		return () => ctx.revert();
	}, [cards, loading]);

	if (loading) {
		return (
			<section className="work">
				<h2 className="work__title">Работа в vidpravki</h2>
				<div className="work__desc">
					<p className="work__desc-text white">
						Мы в поисках надежных людей которые готовы стать частью <br /> нашей команды и
						развиваться вместе с нами!
					</p>

					<p className="work__desc-text">
						Мы гарантируем стабильную оплату труда, многочисленные <br /> премии и незамедлительный
						карьерный рост.
					</p>
				</div>
				<p className="work__desc-text">Загрузка карточек...</p>
				{renderInfoBlocks()}
			</section>
		);
	}

	if (error) {
		return (
			<section className="work">
				<h2 className="work__title">Работа в vidpravki</h2>
				<div className="work__desc">
					<p className="work__desc-text white">
						Мы в поисках надежных людей которые готовы стать частью <br /> нашей команды и
						развиваться вместе с нами!
					</p>
					<p className="work__desc-text">
						Мы гарантируем стабильную оплату труда, многочисленные <br /> премии и незамедлительный
						карьерный рост.
					</p>
				</div>
				<p className="work__desc-text work__desc-text--error">{error}</p>
				{renderInfoBlocks()}
			</section>
		);
	}

	if (cards.length === 0) {
		return (
			<section className="work">
				<h2 className="work__title">Работа в vidpravki</h2>
				<div className="work__desc">
					<p className="work__desc-text white">
						Мы в поисках надежных людей которые готовы стать частью <br /> нашей команды и
						развиваться вместе с нами!
					</p>
					<p className="work__desc-text">
						Мы гарантируем стабильную оплату труда, многочисленные <br /> премии и незамедлительный
						карьерный рост.
					</p>
				</div>
				<p className="work__desc-text">Карточки работы пока не добавлены.</p>
				{renderInfoBlocks()}
			</section>
		);
	}

	return (
		<section className="work" id="work" ref={sectionRef}>
			<h2 className="work__title">Работа в vidpravki</h2>
			<div className="work__desc">
				<p className="work__desc-text white">
					Мы в поисках надежных людей которые готовы стать частью <br /> нашей команды и развиваться
					вместе с нами!
				</p>
				<p className="work__desc-text">
					Мы гарантируем стабильную оплату труда, многочисленные <br /> премии и незамедлительный
					карьерный рост.
				</p>
			</div>

			<ul className="work__list" ref={listRef}>
				{cards.map((card) => (
					<li key={card.id} className="work__list-item">
						<div className="work__list-item-header">
							<img
								className="work__list-item-header-img"
								src={card.icon}
								alt={`${card.title} icon`}
							/>
							<p className="work__list-item-header-caption">{card.title}</p>
						</div>
						<div className="work__list-item-body">
							<p className="work__list-item-body-text">{card.text}</p>
						</div>
						<a href={card.link} className="work__list-item-button">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path
									d="M4 12H20M20 12L14 6M20 12L14 18"
									stroke="#1f2937"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span>Перейти</span>
						</a>
					</li>
				))}
			</ul>
			{renderInfoBlocks()}
		</section>
	);
};

export default Work;
