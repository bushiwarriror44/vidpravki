import { useState, useEffect, useRef } from 'react';
import './css/Navigation.less';
import burger from '../../assets/img/mobile-burger.svg';

export function Navigation() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [activeSection, setActiveSection] = useState('about');
	const observerRef = useRef(null);
	const sectionElementsRef = useRef([]);

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 50);
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const sectionIds = ['about', 'find', 'work', 'calculator'];
		sectionElementsRef.current = [];

		const updateActiveSection = () => {
			const scrollY = window.scrollY + window.innerHeight / 3;
			let currentSection = 'about';
			for (let i = sectionElementsRef.current.length - 1; i >= 0; i--) {
				const { id, element } = sectionElementsRef.current[i];
				const elementTop = element.getBoundingClientRect().top + window.scrollY;
				if (scrollY >= elementTop) {
					currentSection = id;
					break;
				}
			}
			setActiveSection(currentSection);
		};

		const initObserver = () => {
			sectionIds.forEach((id) => {
				const element = document.getElementById(id);
				if (element) sectionElementsRef.current.push({ id, element });
			});

			if (sectionElementsRef.current.length === 0) return;

			sectionElementsRef.current.sort((a, b) => {
				const rectA = a.element.getBoundingClientRect();
				const rectB = b.element.getBoundingClientRect();
				return rectA.top + window.scrollY - (rectB.top + window.scrollY);
			});

			updateActiveSection();

			observerRef.current = new IntersectionObserver(
				(entries) => {
					const intersecting = entries.filter((entry) => entry.isIntersecting);
					if (intersecting.length > 0) {
						intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
						const top = intersecting[0];
						if (top?.intersectionRatio > 0) setActiveSection(top.target.id);
					} else {
						updateActiveSection();
					}
				},
				{
					root: null,
					rootMargin: '-30% 0px -50% 0px',
					threshold: [0, 0.25, 0.5, 0.75, 1],
				},
			);

			sectionElementsRef.current.forEach(({ element }) => observerRef.current?.observe(element));
			window.addEventListener('scroll', updateActiveSection, { passive: true });
		};

		const timeoutId = setTimeout(initObserver, 100);
		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('scroll', updateActiveSection);
			if (observerRef.current) {
				sectionElementsRef.current.forEach(({ element }) =>
					observerRef.current?.unobserve(element),
				);
				observerRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (isMenuOpen) {
			const scrollY = window.scrollY;
			document.body.style.overflow = 'hidden';
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollY}px`;
			document.body.style.width = '100%';
			document.documentElement.style.overflow = 'hidden';
		} else {
			const scrollY = document.body.style.top;
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			document.documentElement.style.overflow = '';
			if (scrollY) window.scrollTo(0, parseInt(scrollY, 10) * -1);
		}

		return () => {
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			document.documentElement.style.overflow = '';
		};
	}, [isMenuOpen]);

	const closeMenu = () => setIsMenuOpen(false);
	const toggleMenu = () => setIsMenuOpen((prev) => !prev);

	const handleAnchorClick = (e, targetId) => {
		e.preventDefault();
		const targetElement = document.getElementById(targetId);
		if (targetElement) {
			const navHeight = document.querySelector('.navigation')?.offsetHeight || 0;
			const targetPosition =
				targetElement.getBoundingClientRect().top + window.scrollY - navHeight - 20;
			window.scrollTo({ top: targetPosition, behavior: 'smooth' });
			setTimeout(() => setActiveSection(targetId), 100);
		}
		closeMenu();
	};

	return (
		<>
			<nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
				<div className="navigation__burger" onClick={toggleMenu}>
					<img src={burger} alt="burger" />
				</div>
				<ul className="navigation__list">
					<li className="navigation__list-item logo">
						<a className="navigation__list-item-link navigation__list-item-link--logo" href="/">
							vidpravki
						</a>
					</li>
					<li className={`navigation__list-item ${activeSection === 'about' ? 'active' : ''}`}>
						<a
							className="navigation__list-item-link"
							href="#about"
							onClick={(e) => handleAnchorClick(e, 'about')}>
							Кто мы?
						</a>
					</li>
					<li className={`navigation__list-item ${activeSection === 'find' ? 'active' : ''}`}>
						<a
							className="navigation__list-item-link"
							href="#find"
							onClick={(e) => handleAnchorClick(e, 'find')}>
							Как нас найти ?
						</a>
					</li>
					<li className={`navigation__list-item ${activeSection === 'work' ? 'active' : ''}`}>
						<a
							className="navigation__list-item-link"
							href="#work"
							onClick={(e) => handleAnchorClick(e, 'work')}>
							Работа в vidpravki
						</a>
					</li>
					<li className={`navigation__list-item ${activeSection === 'calculator' ? 'active' : ''}`}>
						<a
							className="navigation__list-item-link"
							href="#calculator"
							onClick={(e) => handleAnchorClick(e, 'calculator')}>
							Калькулятор
						</a>
					</li>
				</ul>
			</nav>
			<div className={`navigation__mobile-menu ${isMenuOpen ? 'active' : ''}`}>
				<button className="navigation__mobile-menu-close" onClick={closeMenu}>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<ul className="navigation__mobile-menu-list">
					<li className="navigation__mobile-menu-item">
						<a
							className="navigation__mobile-menu-link"
							href="#about"
							onClick={(e) => handleAnchorClick(e, 'about')}>
							Кто мы?
						</a>
					</li>
					<li className="navigation__mobile-menu-item">
						<a
							className="navigation__mobile-menu-link"
							href="#find"
							onClick={(e) => handleAnchorClick(e, 'find')}>
							Как нас найти ?
						</a>
					</li>
					<li className="navigation__mobile-menu-item">
						<a
							className="navigation__mobile-menu-link"
							href="#work"
							onClick={(e) => handleAnchorClick(e, 'work')}>
							Работа в vidpravki
						</a>
					</li>
					<li className="navigation__mobile-menu-item">
						<a
							className="navigation__mobile-menu-link"
							href="#calculator"
							onClick={(e) => handleAnchorClick(e, 'calculator')}>
							Калькулятор
						</a>
					</li>
				</ul>
			</div>
		</>
	);
}
