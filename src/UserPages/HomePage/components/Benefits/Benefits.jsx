import './css/Benefits.less';

const items = [
	{
		title: 'Работаем более 5-ти лет',
		text: 'Выстроили стабильные процессы, проверенные решения и понятный формат взаимодействия.',
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M12 7V12L15 15M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
	{
		title: 'Тысячи довольных покупателей',
		text: 'Качество сервиса и стабильность работы помогают сохранять доверие и возвращаемость.',
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5C14.3431 5 13 6.34315 13 8C13 9.65685 14.3431 11 16 11Z"
					stroke="currentColor"
					strokeWidth="1.8"
				/>
				<path
					d="M8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"
					stroke="currentColor"
					strokeWidth="1.8"
				/>
				<path
					d="M3 19C3 16.7909 4.79086 15 7 15H9C11.2091 15 13 16.7909 13 19M11 19C11 16.7909 12.7909 15 15 15H17C19.2091 15 21 16.7909 21 19"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
				/>
			</svg>
		),
	},
	{
		title: 'Рост наших сотрудников',
		text: 'Помогаем развиваться поэтапно: от стартовой адаптации до более сильных ролей в команде.',
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3 17L9 11L13 15L21 7M21 7H16M21 7V12"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
];

const Benefits = () => {
	return (
		<section className="benefits">
			<div className="benefits__list">
				{items.map((item) => (
					<article className="benefits__item" key={item.title}>
						<div className="benefits__item-icon">{item.icon}</div>
						<h3 className="benefits__item-title">{item.title}</h3>
						<p className="benefits__item-text">{item.text}</p>
					</article>
				))}
			</div>
		</section>
	);
};

export default Benefits;

