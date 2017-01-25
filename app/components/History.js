import React from 'react';
import _ from 'lodash';

import './History.scss';
import TranslationComponent from './Translation';
import APIConnect from './APIConnect';
import * as API from '../api';
import Translation from '../models/Translation';

export default APIConnect(class History extends React.Component {
  render() {
    if(this.props.api.loading) {
      return (
        <div className="History">
          Loading&hellip;
        </div>
      );
    }

    return (
      <div className="History">
        {this.props.api.data.map(translation => {
          return (
            <TranslationComponent key={translation.id} translation={translation} />
          );
        })}

        <div className="History--RefreshButton">
          <i className="fa fa-refresh fa-2x" aria-hidden="true"></i>
        </div>
      </div>
    );
  }
}, async() => {
  const xmlResponse = await API.translationsGet();
  const parser = new DOMParser();
  const dom = parser.parseFromString(xmlResponse, 'application/xml');

  if(dom.documentElement.nodeName !== 'translations') {
    throw new Error('');
  }

  return _.map(dom.documentElement.children, element => {
    const translation = new Translation();
    translation.id = +element.attributes.getNamedItem('id').nodeValue;
    translation.creation_timestamp = new Date(element.attributes.getNamedItem('creation_timestamp').nodeValue);
    translation.lang = element.attributes.getNamedItem('lang').nodeValue;
    translation.native_text = element.attributes.getNamedItem('native_text').nodeValue;
    translation.translated_text = element.attributes.getNamedItem('translated_text').nodeValue;
    return translation;
  });
});
