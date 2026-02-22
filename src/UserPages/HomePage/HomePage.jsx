import React from 'react';
import './css/HomePage.less';
import Intro from './components/Intro/Intro.jsx';
import Links from './components/Links/Links.jsx';
import Benefits from './components/Benefits/Benefits.jsx';
import Work from './components/Work/Work.jsx';
import Calculator from './components/Calculator/Calculator.jsx';
import Footer from './components/Footer/Footer.jsx';
import ChatBot from '../../components/ChatBot/ChatBot.jsx';

const HomePage = () => {
	return (
		<main className="homePage">
			
		<Intro />
		<Links />
		<Benefits />
		<Work />
		<Calculator />
		<Footer />
		<ChatBot />
		</main>
	);
};

export default HomePage;
