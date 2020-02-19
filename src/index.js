import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';

import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.js'
import 'popper.js'
import 'swiper/css/swiper.min.css'
import 'react-datepicker/dist/react-datepicker.css'
import './css/common.css'

import App from './App';

window.$ = $
window.jQuery = $

ReactDOM.render(<App />, document.getElementById('wrap'));
serviceWorker.unregister();
