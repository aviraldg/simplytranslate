import React from 'react';
import type Translation from '../models/Translation';

import './Translation.scss';
import SUPPORTED_LANGUAGES from '../../langs.json';

const TranslationComponent = (props: {translation: Translation}) => {
  return (
    <div className="Translation">
      <div className="Translation--Meta">
        <span className="Translation--Id">{props.translation.id}</span>
        <span style={{float: 'right'}}>{(SUPPORTED_LANGUAGES[props.translation.lang] || {native: 'Unknown'}).native}</span>
      </div>
      <div className="Translation--Native">
        {props.translation.native_text}
      </div>
      <div className="Translation--En">
        {props.translation.translated_text}
      </div>
    </div>
  );
};
export default TranslationComponent;
