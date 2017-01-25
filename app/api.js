import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';

const SPEECH_API_URI = 'https://speech.googleapis.com/v1beta1/speech:syncrecognize';

export async function recognizeSpeech(langCode: string, data: Blob) {
  const promise = Promise.defer();
  const fileReader = new FileReader();
  fileReader.addEventListener('loadend', () => {
    promise.resolve(fileReader.result);
  });
  fileReader.readAsDataURL(data);

  const encodedData = await promise;
  const response = await fetch(`${SPEECH_API_URI}/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GAPI_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: encodedData
  });
}

export async function translationsGet() {
  const response = await fetch(`/api/translations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/xml'
    }
  });
  return await response.text();
}
