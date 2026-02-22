import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useSectionAnimation = (options = {}) => {
    const sectionRef = useRef(null);
    const {
        from = { opacity: 0, y: 50 },
        to = { opacity: 1, y: 0 },
        duration = 1,
        ease = 'power3.out',
        delay = 0,
        start = 'top 80%',
    } = options;

    useEffect(() => {
        const element = sectionRef.current;
        if (!element) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                element,
                from,
                {
                    ...to,
                    duration,
                    ease,
                    delay,
                    scrollTrigger: {
                        trigger: element,
                        start,
                        toggleActions: 'play none none none',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return sectionRef;
};
