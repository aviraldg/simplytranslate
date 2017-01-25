import React from 'react';
import classNames from 'class-names';
import _ from 'lodash';

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
      loading: false,
      recording: false,
      amplitude: 0
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
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        this.data.push(e.data);
      };
      this.mediaRecorder.start();

      this.analyserReq = requestAnimationFrame(this.updateVisualization);
    } else {
      this.mediaRecorder.stop();
      cancelAnimationFrame(this.analyserReq);

      state.amplitude = 0;

      const blob = new Blob(this.data, {type: this.data[0].type});
      const result = await API.recognizeSpeech('en', blob);
      console.log(result);
    }

    this.setState(state);
  }

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
          {this.state.loading ? <i className="fa fa-circle-o-notch fa-2x fa-spin"/> : null}
        </div>
        <div className="Translation">
          <div className="Translation--Meta">
            Translate from:
            <select style={{float: 'right'}}>
              {_.values(SUPPORTED_LANGUAGES).map(lang => {
                return <option key={lang.code}>{lang.native}</option>
              })}
            </select>
          </div>
          <div className="Translation--Native">
            Lorem ipsum.
          </div>
          <div className="Translation--En">
            Lorem ipsum.
          </div>
        </div>
      </div>
    )
  }
}
