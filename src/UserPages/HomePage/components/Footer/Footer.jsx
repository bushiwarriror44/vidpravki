import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './css/Footer.less';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
	const footerRef = useRef(null);

	useEffect(() => {
		const footer = footerRef.current;
		if (!footer) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				footer,
				{ opacity: 0, y: 30 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: footer,
						start: 'top 90%',
						toggleActions: 'play none none none',
					},
				},
			);
		}, footer);

		return () => ctx.revert();
	}, []);

	return (
		<footer className="footer" ref={footerRef}>
			<h2 className="footer__logo">vidpravki</h2>
		</footer>
	);
};

export default Footer;
