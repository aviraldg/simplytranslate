import React from 'react';
import classNames from 'class-names';

import {history} from '../common';
import './Navbar.scss';

const Navbar = () => {
  return (
    <div className="Navbar">
      <div onClick={() => history.push('/')} className={classNames('Navbar--Tab', {'Navbar--Tab_active': location.pathname == '/'})}>Translate</div>
      <div onClick={() => history.push('/history')} className={classNames('Navbar--Tab', {'Navbar--Tab_active': location.pathname == '/history'})}>History</div>
    </div>
  );
};

export default Navbar;
