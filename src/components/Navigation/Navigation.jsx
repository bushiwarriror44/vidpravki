import { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import './css/Navigation.less';

export function Navigation() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const location = useLocation();

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
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

	const toggleMenu = () => setIsMenuOpen((prev) => !prev);
	const closeMenu = () => setIsMenuOpen(false);

	const getActiveSection = () => {
		if (location.pathname === '/') return 'shipments';
		if (location.pathname === '/wholesale') return 'wholesale';
		if (location.pathname === '/promotions') return 'promotions';
		return 'shipments';
	};

	const activeSection = getActiveSection();

	return (
		<>
			<nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
				<div className="navigation__inner">
					<RouterLink className="navigation__logo" to="/" onClick={closeMenu}>
						vidpravki
					</RouterLink>
					<ul className="navigation__list">
						<li
							className={`navigation__list-item ${activeSection === 'shipments' ? 'active' : ''}`}>
							<RouterLink className="navigation__list-item-link" to="/" onClick={closeMenu}>
								Отправки
							</RouterLink>
						</li>
						<li
							className={`navigation__list-item ${activeSection === 'wholesale' ? 'active' : ''}`}>
							<RouterLink
								className="navigation__list-item-link"
								to="/wholesale"
								onClick={closeMenu}>
								Опт кладами
							</RouterLink>
						</li>
						<li
							className={`navigation__list-item ${activeSection === 'promotions' ? 'active' : ''}`}>
							<RouterLink
								className="navigation__list-item-link"
								to="/promotions"
								onClick={closeMenu}>
								Предзаказы из Европы
							</RouterLink>
						</li>
					</ul>
					<div className="navigation__burger" onClick={toggleMenu} aria-label="Открыть меню">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg">
							<path
								d="M4 6H20M4 12H20M4 18H20"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</div>
				</div>
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
						<RouterLink className="navigation__mobile-menu-link" to="/" onClick={closeMenu}>
							Отправки
						</RouterLink>
					</li>
					<li className="navigation__mobile-menu-item">
						<RouterLink
							className="navigation__mobile-menu-link"
							to="/wholesale"
							onClick={closeMenu}>
							Опт кладами
						</RouterLink>
					</li>
					<li className="navigation__mobile-menu-item">
						<RouterLink
							className="navigation__mobile-menu-link"
							to="/promotions"
							onClick={closeMenu}>
							Предзаказы из Европы
						</RouterLink>
					</li>
				</ul>
			</div>
		</>
	);
}
