import {Router} from "express";
import db from "sqlite";
import xmlbuilder from "xmlbuilder";
import Translate from "@google-cloud/translate";
import Speech from "@google-cloud/speech";

import {upload} from './common';
import {gProjectId} from "./package.json";
import SUPPORTED_LANGUAGES from './langs.json';

const api = Router();
export default api;

const translateClient = Translate({projectId: process.env.GPROJECT_ID || gProjectId, key: process.env.GAPI_KEY});
const speechClient = Speech({projectId: process.env.GPROJECT_ID || gProjectId, key: process.env.GAPI_KEY});

const TARGET_LANG = 'en';

const TRANSLATION = 'Translation';
const TRANSLATION_ID = 'id';
const TRANSLATION_LANG = 'lang';
const TRANSLATION_CREATION_TIMESTAMP = 'creation_timestamp';
const TRANSLATION_NATIVE_TEXT = 'native_text';
const TRANSLATION_TRANSLATED_TEXT = 'translated_text';
const TRANSLATION_COLUMNS = [TRANSLATION_ID, TRANSLATION_LANG, TRANSLATION_CREATION_TIMESTAMP, TRANSLATION_NATIVE_TEXT, TRANSLATION_TRANSLATED_TEXT];

function panic(res, reason, e, code = 500) {
  console.error(e);
  return res.status(code).send({
    error: reason
  });
}

api.route('/translations')
  .get(async(req, res) => {
    let translations;
    try {
      translations = await db.all(`SELECT * FROM ${TRANSLATION} ORDER BY ${TRANSLATION_CREATION_TIMESTAMP} DESC, ${TRANSLATION_TRANSLATED_TEXT} ASC`);
    } catch (e) {
      return panic(res, 'failed to query database', e);
    }

    const xml = xmlbuilder.create('translations');
    translations.forEach(translation => {
      const translationTag = xml.ele('translation');
      TRANSLATION_COLUMNS.forEach(column => {
        translationTag.att(column, translation[column]);
      });
    });

    res.contentType('xml');
    xml.end(xmlbuilder.streamWriter(res));
    res.send();
  })
  .post(async(req, res) => {
    const translation = req.body;

    if (translation == null || translation[TRANSLATION_LANG] == null || translation[TRANSLATION_NATIVE_TEXT] == null) {
      res.status(400);
      res.send();
      return;
    }

    let translatedText = translation[TRANSLATION_NATIVE_TEXT];
    if(!translation[TRANSLATION_LANG].startsWith('en')) {
      try {
        // Extracting the first part of the language code works for everything but Chinese, and
        // the mapping there is not very obvious.
        translatedText = (await translateClient.translate(translation[TRANSLATION_NATIVE_TEXT],
          {
            from: translation[TRANSLATION_LANG].split('-')[0],
            to: TARGET_LANG
          }))[0];
      } catch (e) {
        return panic(res, `failed to translate`, e);
      }
    }

    translation[TRANSLATION_TRANSLATED_TEXT] = translatedText;

    try {
      const created = await db.run(`INSERT INTO ${TRANSLATION} (${TRANSLATION_CREATION_TIMESTAMP}, ${TRANSLATION_LANG}, ${TRANSLATION_NATIVE_TEXT}, ${TRANSLATION_TRANSLATED_TEXT}) VALUES (DATETIME(), ?, ?, ?)`, [
        translation[TRANSLATION_LANG],
        translation[TRANSLATION_NATIVE_TEXT],
        translation[TRANSLATION_TRANSLATED_TEXT]
      ]);

      const response = Object.assign({}, translation, {
        id: created.id,
        translated_text: translatedText
      });
      res.status(201).send(response);
    } catch (e) {
      return panic(res, 'failed to save translation to database', e);
    }
  });

api.post('/recognize/:langCode', upload.single('speech'), async(req, res) => {
  if(!SUPPORTED_LANGUAGES[req.params.langCode]) {
    res.status(400)
      .send({
        error: 'Unsupported language code.'
      });
  }

  const data = req.file.buffer;

  let response = [];
  try {
    response = await speechClient.recognize({
      content: data,
    }, {
      encoding: 'LINEAR16',
      sampleRate: +req.param('sampleRate') || 44100,
      languageCode: req.params.langCode
    });
    console.log(response);
  } catch (e) {
    console.error(e);
    res.status(500).send({
      error: 'Google Speech API call failed'
    });
  }

  res.status(200).send({
    text: response[0]
  });
});
