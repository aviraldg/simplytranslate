import 'babel-core/register';
import 'babel-polyfill';

import ReactDOM from 'react-dom';
import React from 'react';

import Navbar from './components/Navbar';
import Recorder from './components/Recorder';
import History from './components/History';
import './SimplyTranslate.scss';
import {history} from './common';


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      location: history.location
    };
  }

  componentDidMount() {
    history.listen((location, action) => {
      this.setState({location});
    });
  }

  render() {
    return (
      <div className="SimplyTranslate">
        <Navbar />
        {this.state.location.pathname == '/' ? <Recorder /> : <History/>}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#app'));
