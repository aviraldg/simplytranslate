import React from 'react';
import classNames from 'class-names';
import _ from 'lodash';
import MediaStreamRecorder from 'msr';

import SUPPORTED_LANGUAGES from '../../langs.json';
import './Recorder.scss';
import './Translation.scss';
import * as API from '../api';

const audioContext = new (window.AudioContext || window.mozAudioContext || window.webkitAudioContext)();
const getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
const analyser = audioContext.createAnalyser();

export default class Recorder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recording: false,
      amplitude: 0,
      lang: 'hi-IN',
      native: 'Once you\'ve recorded audio, it\'ll show up here.',
      translated: 'And the English equivalent will show up here.',
      nativeStatus: 'loaded',
      translatedStatus: 'loaded'
    };

    this.data = [];
    this.dataArray = new Float32Array(analyser.frequencyBinCount);

    this.onUserMediaSuccess = this.onUserMediaSuccess.bind(this);
    this.onUserMediaFailure = this.onUserMediaFailure.bind(this);
    this.onClick = this.onClick.bind(this);
    this.updateVisualization = this.updateVisualization.bind(this);

    getUserMedia.call(navigator, {
      audio: true
    }, this.onUserMediaSuccess, this.onUserMediaFailure);
  }

  onUserMediaSuccess(stream) {
    this.stream = stream;
  }

  onUserMediaFailure() {

  }

  updateVisualization() {
    analyser.getFloatTimeDomainData(this.dataArray);
    let total = 0, alpha = 0.7;
    this.dataArray.forEach(value => {
      total += Math.pow(value, 2);
    });
    this.setState({amplitude: Math.sqrt(total / this.dataArray.length) * (1 - alpha) + this.state.amplitude * alpha});
    this.analyserReq = requestAnimationFrame(this.updateVisualization);
  }

  async onClick() {
    const recording = !this.state.recording;
    const state = {recording};

    if (recording) {
      this.data = [];
      this.source = audioContext.createMediaStreamSource(this.stream);
      this.source.connect(analyser);
      this.mediaRecorder = new MediaStreamRecorder(this.stream);
      this.mediaRecorder.mimeType = 'audio/wav';
      this.mediaRecorder.recorderType = class extends MediaStreamRecorder.StereoAudioRecorder {
        constructor(mediaStream) {
          super(mediaStream);
          // The Google Cloud Speech API expects a single channel ONLY.
          this.audioChannels = 1;
        }
      };
      this.mediaRecorder.ondataavailable = (e) => {
        this.data.push(e);
      };
      this.mediaRecorder.start();

      this.analyserReq = requestAnimationFrame(this.updateVisualization);
    } else {
      ConcatenateBlobs(this.data, this.data[0].type, async(concatenatedBlob) => {
        const srcLanguage = this.state.lang;
        this.setState({nativeStatus: 'loading'});
        const result = await API.recognizeSpeech(srcLanguage, concatenatedBlob, {
          sampleRate: audioContext.sampleRate
        });
        this.data = [];
        this.setState({native: result.text, nativeStatus: 'loaded', translatedStatus: 'loading'});
        const translation = await API.translationsPost(srcLanguage, result.text);
        this.setState({translated: translation.translated_text, translatedStatus: 'loaded'});
      });

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.log(e);
      }
      cancelAnimationFrame(this.analyserReq);

      state.amplitude = 0;
    }

    this.setState(state);
  }

  onLanguageChanged = (event) => {
    this.setState({lang: event.target.value});
  };

  render() {
    const className = classNames('Recorder fa-stack fa-lg', {
      'Recorder_recording': this.state.recording
    });

    const style = {
      boxShadow: `0 0 0 ${Math.round(this.state.amplitude * 128)}px gray`
    };

    const iconClassName = classNames("fa fa-stack-1x", {
      "fa-stop": this.state.recording,
      "fa-microphone": !this.state.recording,
    });

    return (
      <div className="Recorder--wrapper">
        <div className={className} style={style} onClick={this.onClick}>
          <i className={iconClassName}/>
        </div>
        <div className="Translation">
          <div className="Translation--Meta">
            Translate from:
            <select style={{float: 'right'}} onChange={this.onLanguageChanged} value={this.state.lang}>
              {_.values(SUPPORTED_LANGUAGES).map(lang => {
                return <option value={lang.code} key={lang.code}>{lang.native}</option>
              })}
            </select>
          </div>
          <div className="Translation--Native">
            {this.state.nativeStatus === 'loading' ?
              <i className="fa fa-circle-o-notch fa-spin fa-1x fa-fw"/> : this.state.native}
          </div>
          <div className="Translation--En">
            {this.state.translatedStatus === 'loading' ?
              <i className="fa fa-circle-o-notch fa-spin fa-1x fa-fw"/> : this.state.translated}
          </div>
        </div>
      </div>
    )
  }
}
