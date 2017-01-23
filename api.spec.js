jest.mock('@google-cloud/translate', () => {
    return jest.fn(() => {
        return {
            translate: async (text, config) => {
                return text;
            }
        }
    });
});
import Translate from '@google-cloud/translate';

import supertest from 'supertest';
import db from 'sqlite';
import xml2js from 'xml2js';
import _ from 'lodash';

import app from './server';

const request = supertest(app);

beforeEach(async () => {
    await db.open(':memory:');
    await db.migrate({ force: 'last' });

    await db.run(`
    INSERT INTO Translation (creation_timestamp, lang, native_text, translated_text) VALUES (0, 'en', 'abc', 'abc'), (0, 'en', 'def', 'def'), (1, 'en', 'ghi', 'ghi');
    `);
})

describe('/api/', () => {
    describe('translations', () => {
        describe('GET', () => {
            it('should list translations in correct order', async () => {
                let values = [];
                await request.get('/api/translations')
                    .expect(res => {                        
                        return new Promise((resolve, reject) => {
                            xml2js.parseString(res.text, (err, result) => {
                                if (err != null) reject(err);
                                values = _.map(result.translations.translation, i => i.$.native_text);
                                resolve();
                            });
                        });
                    })
                    .expect(200);
                
                expect(values).toEqual(['ghi', 'abc', 'def']);
            });
        });

        describe('POST', () => {
            it('should create a new translation', async () => {
                await request.post('/api/translations')
                    .send({
                        lang: 'en',
                        native_text: 'hello'
                    })
                    .expect(201);
                expect((await db.get('SELECT COUNT(id) as count FROM Translation')).count).toBe(4);
            });

            it('should fail with 400 if required parameters are missing', async () => {
                await request.post('/api/translations')
                    .expect(400);
            });
        });
    });
});
