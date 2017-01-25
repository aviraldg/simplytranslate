import fetch from 'isomorphic-fetch';

import Translation from './models/Translation';

export async function recognizeSpeech(langCode: string, data: Blob, options: {sampleRate: number}) {
  const formData = new FormData();
  formData.append('speech', data);

  const response = await fetch(`/api/recognize/${langCode}?sampleRate=${options.sampleRate || 44100}`, {
    method: 'POST',
    body: formData
  });

  if(response.error) {
    throw new Error(response.error);
  }

  return await response.json();
}

export async function translationsGet() {
  const response = await fetch(`/api/translations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/xml'
    }
  });

  if(response.status !== 200) {
    throw new Error('failed to load history');
  }

  return await response.text();
}

export async function translationsPost(srcLanguage: string, text: string): ?Translation {
  const response = await fetch(`/api/translations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      lang: srcLanguage,
      native_text: text
    })
  });

  if(response.error) {
    throw new Error(response.error);
  }

  return await response.json();
}
