import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'semantic-ui-css/semantic.min.css';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.Fragment>
    <App />
  </React.Fragment>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

const HeeboFont = document.createElement('link');
HeeboFont.rel = 'stylesheet';
HeeboFont.href = "https://fonts.googleapis.com/css2?family=Heebo&display=swap";
document.head.appendChild(HeeboFont);
