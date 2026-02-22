import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/Links.less';

gsap.registerPlugin(ScrollTrigger);

const Links = () => {
	const [links, setLinks] = useState([]);
	const [loading, setLoading] = useState(true);
	const sectionRef = useRef(null);
	const listRef = useRef(null);

	useEffect(() => {
		const fetchLinks = async () => {
			try {
				const response = await fetch('/api/get_links');
				const data = await response.json();
				if (data.links) {
					setLinks(data.links);
				}
			} catch (error) {
				console.error('Error loading links:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchLinks();
	}, []);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				section,
				{ opacity: 0, y: 50 },
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: section,
						start: 'top 80%',
						toggleActions: 'play none none none',
					},
				}
			);

			if (listRef.current && links.length > 0) {
				gsap.fromTo(
					listRef.current.children,
					{ opacity: 0, x: -30 },
					{
						opacity: 1,
						x: 0,
						duration: 0.6,
						ease: 'power2.out',
						stagger: 0.1,
						scrollTrigger: {
							trigger: listRef.current,
							start: 'top 85%',
							toggleActions: 'play none none none',
						},
					}
				);
			}
		}, section);

		return () => ctx.revert();
	}, [links, loading]);

	return (
		<section className="find" id="find" ref={sectionRef}>
			<h2 className="find__title">Где нас найти ?</h2>
			<div className="find__desc">
				<p className="find__desc-text white">Все актуальные контакты размещены ниже.</p>
				<p className="find__desc-text">
					Обязательно сверяйте их перед совершением сделки и будьте внимательны!
				</p>
			</div>
			{loading ? (
				<div className="find__status">
					Загрузка...
				</div>
			) : links.length > 0 ? (
				<ul className="find__list" ref={listRef}>
					{links.map((link) => (
						<li key={link.id} className="find__list-item">
							<a className="find__list-item-link" href={link.url} target="_blank" rel="noopener noreferrer">
								<img src={link.icon} alt={link.text} />
								{link.text}
							</a>
						</li>
					))}
				</ul>
			) : (
				<div className="find__status">
					Ссылки не найдены
				</div>
			)}
		</section>
	);
}

export default Links;
