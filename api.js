import { Router } from 'express';
import db from 'sqlite';
import xmlbuilder from 'xmlbuilder';
import Translate from '@google-cloud/translate';

import { gProjectId } from './package.json';

const api = Router();
export default api;

const translateClient = Translate({ projectId: process.env.GPROJECT_ID || gProjectId, key: process.env.GAPI_KEY });

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
    .get(async (req, res) => {
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
    .post(async (req, res) => {
        const translation = req.body;

        if (translation == null || translation[TRANSLATION_LANG] == null || translation[TRANSLATION_NATIVE_TEXT] == null) {
            res.status(400);
            res.send();
            return;
        }

        let translatedText = null;
        try {
            translatedText = (await translateClient.translate(translation[TRANSLATION_NATIVE_TEXT],
            {
                from: translation[TRANSLATION_LANG],
                to: TARGET_LANG
            }))[0];
        
            translation[TRANSLATION_TRANSLATED_TEXT] = translatedText;
        } catch (e) {
            return panic(res, `failed to translate`, e);
        }
        
        try {
            const created = await db.run(`INSERT INTO ${TRANSLATION} (${TRANSLATION_CREATION_TIMESTAMP}, ${TRANSLATION_LANG}, ${TRANSLATION_NATIVE_TEXT}, ${TRANSLATION_TRANSLATED_TEXT}) VALUES (DATETIME(), ?, ?, ?)`, [
                translation[TRANSLATION_LANG],
                translation[TRANSLATION_NATIVE_TEXT],
                translation[TRANSLATION_TRANSLATED_TEXT]
            ]);
        } catch (e) {
            return panic(res, 'failed to save translation to database', e);
        }

        res.status(201).send({
            translation: translatedText
        });
    });
