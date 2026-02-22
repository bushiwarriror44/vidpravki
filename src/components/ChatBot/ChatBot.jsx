import { useState, useRef, useEffect } from 'react';
import './css/ChatBot.less';

const ChatBot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [message, setMessage] = useState('');
	const [contactMethod, setContactMethod] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [resultMessage, setResultMessage] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);
	const messageRef = useRef(null);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				messageRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		if (!message.trim() || !contactMethod.trim()) {
			setIsSuccess(false);
			setResultMessage('Заполните сообщение и способ связи');
			return;
		}

		setIsLoading(true);
		setResultMessage('');

		try {
			const response = await fetch('/api/support-requests', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: message.trim(),
					contact_method: contactMethod.trim(),
				}),
			});

			const data = await response.json();
			if (data.success) {
				setIsSuccess(true);
				setResultMessage(data.message || 'Заявка отправлена');
				setMessage('');
				setContactMethod('');
			} else {
				setIsSuccess(false);
				setResultMessage(data.message || 'Ошибка при отправке обращения');
			}
		} catch (error) {
			console.error('Error sending support request:', error);
			setIsSuccess(false);
			setResultMessage('Ошибка соединения. Попробуйте еще раз.');
		} finally {
			setIsLoading(false);
		}
	};

	const toggleChat = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			<button 
				className={`chatbot__toggle ${isOpen ? 'chatbot__toggle--active' : ''}`}
				onClick={toggleChat}
				aria-label="Открыть интерактивную поддержку"
			>
				<svg className="chatbot__toggle-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M8 10H16M8 14H13M7 20L4 22V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H7Z"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="chatbot__overlay" onClick={toggleChat}>
					<div className="chatbot__popup" onClick={(e) => e.stopPropagation()}>
						<div className="chatbot__header">
							<h3 className="chatbot__header-title">Интерактивная поддержка</h3>
							<button 
								className="chatbot__header-close"
								onClick={toggleChat}
								aria-label="Закрыть чат"
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</button>
						</div>

						<form className="chatbot__form" onSubmit={handleSubmit}>
							<p className="chatbot__form-note">
								Опишите ваш вопрос и укажите удобный способ связи. Обращение сразу появится в
								админ-панели.
							</p>
							<label className="chatbot__label" htmlFor="support-message">Сообщение</label>
							<textarea
								id="support-message"
								ref={messageRef}
								className="chatbot__input"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Например: хочу уточнить условия сотрудничества..."
								rows="5"
								disabled={isLoading}
							/>

							<label className="chatbot__label" htmlFor="support-contact">Желаемый способ связи</label>
							<input
								id="support-contact"
								className="chatbot__input"
								type="text"
								value={contactMethod}
								onChange={(e) => setContactMethod(e.target.value)}
								placeholder="Telegram @username, Email, Session ID и т.д."
								disabled={isLoading}
							/>

							{resultMessage && (
								<div className={`chatbot__result ${isSuccess ? 'success' : 'error'}`}>
									{resultMessage}
								</div>
							)}

							<button
								className="chatbot__send-button"
								type="submit"
								disabled={isLoading}
								aria-label="Отправить обращение"
							>
								{isLoading ? 'Отправка...' : 'Отправить обращение'}
							</button>
						</form>
					</div>
				</div>
			)}
		</>
	);
};

export default ChatBot;
