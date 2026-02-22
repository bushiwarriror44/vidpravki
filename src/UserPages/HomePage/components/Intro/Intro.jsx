import { Navigation } from '../../../../components/Navigation/NavigationFixed';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/Intro.less';

gsap.registerPlugin(ScrollTrigger);

const Intro = () => {
	const [introLink, setIntroLink] = useState('#about');
	const [backgroundPath, setBackgroundPath] = useState('/assets/img/main/intro-bg.png');
	const [backgroundType, setBackgroundType] = useState('image');
	const introWrapperRef = useRef(null);

	useEffect(() => {
		const fetchIntroLink = async () => {
			try {
				const response = await fetch('/api/get_intro_button_link');
				if (response.ok) {
					const data = await response.json();
					if (data.link) {
						setIntroLink(data.link);
					}
				}
			} catch (error) {
				console.error('Failed to fetch intro button link:', error);
			}
		};

		const fetchIntroBackground = async () => {
			try {
				const response = await fetch('/api/get_intro_background');
				if (response.ok) {
					const data = await response.json();
					if (data.background_path) {
						setBackgroundPath(data.background_path);
						setBackgroundType(data.background_type || 'image');
					}
				}
			} catch (error) {
				console.error('Failed to fetch intro background:', error);
			}
		};

		fetchIntroLink();
		fetchIntroBackground();
	}, []);

	useEffect(() => {
		const wrapper = introWrapperRef.current;
		if (!wrapper) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				wrapper.children,
				{ opacity: 0, y: 50 },
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: 'power3.out',
					stagger: 0.2,
					scrollTrigger: {
						trigger: wrapper,
						start: 'top 80%',
						toggleActions: 'play none none none',
					},
				},
			);
		}, wrapper);

		return () => ctx.revert();
	}, []);

	return (
		<>
			<section className="intro" id="about">
				<Navigation />
				{backgroundType === 'video' ? (
					<video
						className="intro__bg"
						src={backgroundPath}
						autoPlay
						loop
						muted
						playsInline
						style={{ objectFit: 'contain' }}
					/>
				) : (
					<img className="intro__bg" src={backgroundPath} alt="Intro Background" />
				)}
				<div className="intro-wrapper" ref={introWrapperRef}>
					<h1 className="intro__title">
						vidpravki - начни свой путь
						<br />в независимость
					</h1>
					<p className="intro__desc">
						Наша команда одна из самых устойчивых на рынке даркнета. <br /> Предлагаем высокий
						доход, обучение за счет компании и гибкий <br /> график. Работа выстроена системно, с
						понятными задачами и <br /> ориентацией на результат.
					</p>

					<p className="intro__meta">
						Актуальные условия и детали по направлениям доступны по кнопке ниже.
					</p>
					<a className="intro__details" href={introLink}>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg">
							<path
								d="M4 12H20M20 12L14 6M20 12L14 18"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						Подробнее
					</a>
				</div>
			</section>
			<section className="intro-features" aria-labelledby="intro-features-title">
				<div className="intro-features__head">
					<h2 className="intro-features__title" id="intro-features-title">
						Почему с нами удобно работать
					</h2>
					<p className="intro-features__desc">
						Мы выстроили процесс так, чтобы вход в работу был понятным, а ежедневные задачи -
						четкими и прогнозируемыми. Ниже собрали ключевые принципы, которые помогают стабильно
						двигаться к результату.
					</p>
				</div>
				<div className="intro-features__grid">
					<div className="intro-features__item">
						<span className="intro-features__item-title">Быстрый старт</span>
						<span className="intro-features__item-text">
							Пошаговое введение в процессы, поддержка на старте и понятная система адаптации без
							перегруза лишней информацией.
						</span>
					</div>
					<div className="intro-features__item">
						<span className="intro-features__item-title">Стабильные условия</span>
						<span className="intro-features__item-text">
							Прозрачные правила работы, четкие ожидания по задачам и прогнозируемая финансовая
							модель с возможностью роста.
						</span>
					</div>
					<div className="intro-features__item">
						<span className="intro-features__item-title">Фокус на результат</span>
						<span className="intro-features__item-text">
							Системный подход, командное взаимодействие и регулярная обратная связь, чтобы каждый
							этап приносил измеримый прогресс.
						</span>
					</div>
				</div>
				<p className="intro-features__note">
					Каждое направление сопровождается актуальными материалами и рабочими инструкциями, чтобы
					вы могли уверенно планировать нагрузку и масштабировать результат.
				</p>
			</section>
		</>
	);
};

export default Intro;
