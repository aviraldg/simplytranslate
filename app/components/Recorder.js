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
      mounted: true,
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

    getUserMedia.call(navigator, {
      audio: true
    }, this.onUserMediaSuccess, this.onUserMediaFailure);
  }

  componentDidMount() {
    this.setState({mounted: true});
  }

  componentWillUnmount() {
    this.setState({mounted: false});
  }

  onUserMediaSuccess = (stream) => {
    this.stream = stream;
  };

  onUserMediaFailure = () => {
    alert('Failed to getUserMedia.');
  };

  /* Updates the loudness visualization around the record button */
  updateVisualization = () => {
    analyser.getFloatTimeDomainData(this.dataArray);
    let total = 0, alpha = 0.7;
    this.dataArray.forEach(value => {
      total += Math.pow(value, 2);
    });
    this.setState({amplitude: Math.sqrt(total / this.dataArray.length) * (1 - alpha) + this.state.amplitude * alpha});
    this.analyserReq = requestAnimationFrame(this.updateVisualization);
  };

  onRecordClicked = async() => {
    // If we're already loading, ignore this click.
    if (this.state.nativeStatus === 'loading' || this.state.translatedStatus === 'loading') {
      return;
    }

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
      ConcatenateBlobs(this.data, this.data[0].type, this.startTranslation);

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.log(e);
      }
      cancelAnimationFrame(this.analyserReq);

      state.amplitude = 0;
    }

    this.setState(state);
  };

  /* Actually kicks off the process of transcribing and translating, given a Blob containing audio.
   The `this.state.mounted &&` chains guard against attempting to set state after we've been unmounted.
   (fetch/ES6 promises are not cancellable... yet)
   */
  startTranslation = async(blob: Blob) => {
    const srcLanguage = this.state.lang;

    this.state.mounted && this.setState({nativeStatus: 'loading'});
    let result = null;
    try {
      result = await API.recognizeSpeech(srcLanguage, blob, {
        sampleRate: audioContext.sampleRate
      });

      this.data = [];
      this.state.mounted && this.setState({native: result.text, nativeStatus: 'loaded', translatedStatus: 'loading'});
    } catch(e) {
      console.error(e);
      this.state.mounted && this.setState({native: 'Failed to transcribe. Please retry.', nativeStatus: 'error'});
      return;
    }

    try {
      const translation = await API.translationsPost(srcLanguage, result.text);
      this.state.mounted && this.setState({translated: translation.translated_text, translatedStatus: 'loaded'});
    } catch(e) {
      this.state.mounted && this.setState({translated: 'Failed to translate. Please retry.', translatedStatus: 'error'});
      console.error(e);
    }
  };

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
        <div className={className} style={style} onClick={this.onRecordClicked}>
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
