import React from 'react';
import Form from './Form';
const homeImg = require('../../styles/images/image.jpg');

function Home() {
    return (
        <div className="home">
            <div className="header--div">
                <h1 className='home--header'>Book your Barber</h1>
            </div>
            <div className="text--div">
                <h2 className='home--text'>Great hair doesn't happen by chance. it happens by appointment! <span className='desktop-aproach'>So don't wait and book your appointment now!</span></h2>
            </div>
            <img src={homeImg} alt="mainImage" className='home--image' />
            <Form />
        </div>
    );
}

export default Home;